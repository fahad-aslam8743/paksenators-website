import { google, youtube_v3 } from 'googleapis';
import { Readable } from 'stream';

/**
 * YouTube Data API v3 integration.
 *
 * Replaces local-disk video storage entirely: every video uploaded through
 * the admin panel is streamed straight to the site's YouTube channel via a
 * resumable upload. Nothing video-related is written to this server's disk
 * anymore. The site stores only the returned YouTube video ID and renders
 * it back with the standard embed player.
 *
 * Required environment variables (see .env.example):
 *   YOUTUBE_CLIENT_ID
 *   YOUTUBE_CLIENT_SECRET
 *   YOUTUBE_REFRESH_TOKEN
 *   YOUTUBE_CHANNEL_ID      (optional but recommended — used to scope the
 *                            two-way sync to your channel specifically)
 */

let oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;
let youtubeClient: youtube_v3.Youtube | null = null;
let youtubeReady = false;

function initYouTube() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn(
      '[YouTube] YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN are not fully set. ' +
      'Video upload endpoints will return 503 until these are configured in .env. ' +
      'See ADMIN_SETUP.md for how to generate a refresh token.'
    );
    return;
  }

  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  youtubeClient = google.youtube({ version: 'v3', auth: oauth2Client });
  youtubeReady = true;
  console.log('[YouTube] YouTube Data API client initialized.');
}

initYouTube();

export function isYouTubeConfigured(): boolean {
  return youtubeReady;
}

export interface YouTubeUploadResult {
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}

/**
 * Uploads a video buffer to the configured YouTube channel using a
 * resumable upload. Returns the new video's ID plus ready-to-use embed and
 * watch URLs.
 *
 * privacyStatus defaults to 'unlisted' so videos are playable via direct
 * link/embed on the site immediately without appearing in public YouTube
 * search — change to 'public' if you want uploads to also be publicly
 * discoverable on YouTube itself.
 */
export async function uploadVideoToYouTube(
  buffer: Buffer,
  opts: {
    title: string;
    description?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
  }
): Promise<YouTubeUploadResult> {
  if (!youtubeReady || !youtubeClient) {
    throw new Error('YouTube is not configured on this server. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN in .env.');
  }

  const stream = Readable.from(buffer);

  const res = await youtubeClient.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: opts.title || 'Untitled Video',
        description: opts.description || '',
      },
      status: {
        privacyStatus: opts.privacyStatus || 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: stream,
    },
  });

  const videoId = res.data.id;
  if (!videoId) {
    throw new Error('YouTube upload succeeded but returned no video ID.');
  }

  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/**
 * Updates title/description on an existing YouTube video (used when an
 * admin edits a video's metadata after it's already been uploaded).
 */
export async function updateYouTubeVideoMetadata(
  videoId: string,
  opts: { title?: string; description?: string }
): Promise<void> {
  if (!youtubeReady || !youtubeClient) {
    throw new Error('YouTube is not configured on this server.');
  }

  const existing = await youtubeClient.videos.list({ part: ['snippet'], id: [videoId] });
  const snippet = existing.data.items?.[0]?.snippet;
  if (!snippet) return;

  await youtubeClient.videos.update({
    part: ['snippet'],
    requestBody: {
      id: videoId,
      snippet: {
        ...snippet,
        title: opts.title ?? snippet.title,
        description: opts.description ?? snippet.description,
      },
    },
  });
}

/**
 * Deletes a video from YouTube. Safe to call even if the video was already
 * removed — YouTube errors on a missing video are swallowed since the end
 * state (video gone) is the same either way.
 */
export async function deleteVideoFromYouTube(videoId: string): Promise<void> {
  if (!youtubeReady || !youtubeClient) return;
  try {
    await youtubeClient.videos.delete({ id: videoId });
  } catch (e: any) {
    console.warn(`[YouTube] Could not delete video ${videoId} (it may already be gone):`, e?.message || e);
  }
}

export interface YouTubeChannelVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
}

/**
 * Lists every video currently on the configured channel by walking its
 * uploads playlist. Used for the "uploaded directly on YouTube -> shows on
 * the site" direction of the sync: any video here that isn't already
 * represented by a video-metadata document in Firestore gets imported.
 */
export async function listChannelVideos(): Promise<YouTubeChannelVideo[]> {
  if (!youtubeReady || !youtubeClient) {
    throw new Error('YouTube is not configured on this server.');
  }

  let channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    const mine = await youtubeClient.channels.list({ part: ['id'], mine: true });
    channelId = mine.data.items?.[0]?.id || undefined;
    if (!channelId) {
      throw new Error('Could not determine the YouTube channel. Set YOUTUBE_CHANNEL_ID in .env.');
    }
  }

  const channelRes = await youtubeClient.channels.list({
    part: ['contentDetails'],
    id: [channelId],
  });
  const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error('Could not find the uploads playlist for this channel.');
  }

  const videos: YouTubeChannelVideo[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const playlistRes: any = await youtubeClient.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of playlistRes.data.items || []) {
      const snippet = item.snippet;
      const videoId = snippet?.resourceId?.videoId;
      if (!videoId) continue;
      videos.push({
        videoId,
        title: snippet.title || 'Untitled Video',
        description: snippet.description || '',
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      });
    }

    pageToken = playlistRes.data.nextPageToken || undefined;
  } while (pageToken);

  return videos;
}
