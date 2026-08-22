import { 
  ref, 
  deleteObject 
} from 'firebase/storage';
import { storage, auth } from './firebase';
import { VideoItem } from '../types/ysp';
import { fetchApi } from './api';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates original video file format and file size
 */
// Browsers can only actually PLAY back a small set of containers/codecs
// natively — MOV and AVI upload fine but silently fail to play on almost
// every phone and browser, which is the #1 cause of "uploaded video won't
// play" reports. Restricting uploads to formats that are guaranteed to
// play everywhere avoids ever accepting a file that will look broken.
const PLAYABLE_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export const validateVideoFile = (file: File): ValidationResult => {
  if (!PLAYABLE_VIDEO_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Unsupported video format. Please upload MP4 or WebM — other formats (like MOV or AVI) upload fine but will not play in most browsers. If your file is a MOV/HEVC iPhone video, convert it to MP4 first.'
    };
  }

  // 500 MB max file size
  const maxSizeBytes = 500 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'Video file size is too large. Maximum allowed size is 500MB.'
    };
  }

  return { valid: true };
};

/**
 * Uploads the video file to the site's YouTube channel via this server's
 * /api/upload/video endpoint (which streams it through to the YouTube
 * Data API — see server/youtube.ts). Nothing is stored on this server's
 * disk. Uses XMLHttpRequest (not fetch) specifically because it's the
 * only way to get real upload progress events for a large file.
 */
export const uploadVideoToServer = (
  file: File,
  onProgress?: (progressPercentage: number) => void,
  meta?: { title?: string; description?: string }
): Promise<{ downloadUrl: string; storagePath: string }> => {
  return new Promise(async (resolve, reject) => {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error || 'Invalid video file'));
      return;
    }

    let authHeader: string | null = null;
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        authHeader = `Bearer ${token}`;
      }
    } catch {
      // Proceed without the header; the server will reject with a clear 401 if required.
    }

    const formData = new FormData();
    formData.append('video', file);
    if (meta?.title) formData.append('title', meta.title);
    if (meta?.description) formData.append('description', meta.description);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/video');
    if (authHeader) xhr.setRequestHeader('Authorization', authHeader);

    let settled = false;

    // Stall guard: if the browser never reports any upload progress at
    // all and the request never completes within 45 seconds, something
    // is genuinely stuck (bad network, server unreachable) — abort
    // cleanly instead of leaving the UI spinning forever.
    const stallTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      xhr.abort();
      reject(new Error('Video upload timed out. Please check your connection and try again.'));
    }, 45000);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Any progress means the connection is alive — extend the stall window.
        clearTimeout(stallTimer);
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(stallTimer);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);
          resolve({ downloadUrl: data.downloadUrl, storagePath: data.storagePath });
        } catch {
          reject(new Error('Server returned an invalid response.'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Upload failed (status ${xhr.status}).`));
        } catch {
          reject(new Error(`Upload failed (status ${xhr.status}).`));
        }
      }
    };

    xhr.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(stallTimer);
      reject(new Error('Network error during video upload. Please check your connection.'));
    };

    xhr.send(formData);
  });
};

/**
 * Deletes a video. All videos now live on YouTube (storagePath format
 * "youtube:VIDEO_ID"), so this just calls our server, which removes the
 * video from the YouTube channel via the YouTube Data API. Legacy
 * Firebase-Storage-hosted records (from before this app moved to YouTube)
 * are still cleaned up here too, so old data doesn't leak storage.
 */
export const deleteVideoFromFirebase = async (storagePath: string): Promise<void> => {
  if (!storagePath || storagePath.startsWith('fallback_video_')) {
    return;
  }

  if (storagePath.startsWith('youtube:')) {
    try {
      await fetchApi(`/upload/video/${encodeURIComponent(storagePath)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Could not delete YouTube video:', err);
    }
    return;
  }

  // Legacy records from before this app used YouTube (local disk or
  // Firebase Storage). Local-disk files no longer exist on this server;
  // only attempt the Firebase Storage path form.
  if (storagePath.startsWith('local:videos/') || !storagePath.includes('/')) {
    return;
  }
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete storage video file:', err);
  }
};

/**
 * Get Videos — this server's own local database (ysp_db.json) is the
 * single source of truth for video metadata, not Firestore. Video metadata
 * used to be written to BOTH Firestore and the local API, which caused a
 * bug: deleting a video locally could succeed while the Firestore delete
 * silently failed (e.g. a stale auth token), so the "deleted" video would
 * reappear on the next page load because Firestore was checked first.
 * Reading from a single place removes that failure mode entirely.
 */
export const getVideosFromFirestore = async (): Promise<VideoItem[]> => {
  try {
    const apiVideos = await fetchApi<VideoItem[]>('/videos');
    if (Array.isArray(apiVideos)) {
      return apiVideos.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
  } catch (apiError) {
    console.warn('Failed to load videos from the local server:', apiError);
  }
  return [];
};

/**
 * Save / Update Video metadata — local server only (see note above).
 */
export const saveVideoToFirestore = async (
  videoData: Partial<VideoItem> & { id: string }
): Promise<VideoItem> => {
  const timestamp = new Date().toISOString();

  const payload = {
    title: videoData.title || 'Untitled Video',
    description: videoData.description || '',
    category: videoData.category || 'Parliamentary Sessions',
    videoUrl: videoData.videoUrl || '',
    storagePath: videoData.storagePath || '',
    thumbnailUrl: videoData.thumbnailUrl || '',
    thumbnailStoragePath: videoData.thumbnailStoragePath || '',
    duration: videoData.duration || '',
    uploadedBy: videoData.uploadedBy || 'Administrator',
    status: videoData.status || 'published',
    sortOrder: typeof videoData.sortOrder === 'number' ? videoData.sortOrder : 1,
    createdAt: videoData.createdAt || timestamp,
    updatedAt: timestamp,
    isDemo: videoData.isDemo ?? false
  };

  try {
    const saved = await fetchApi<VideoItem>(`/videos/${videoData.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }).catch(async () => {
      return await fetchApi<VideoItem>('/videos', {
        method: 'POST',
        body: JSON.stringify({ id: videoData.id, ...payload })
      });
    });
    return saved || ({ id: videoData.id, ...payload } as VideoItem);
  } catch (apiError) {
    console.error('Failed to save video:', apiError);
    throw apiError instanceof Error ? apiError : new Error('Failed to save video.');
  }
};

/**
 * Delete video — removes the video (and thumbnail) files from disk/storage,
 * then removes the metadata record from the local server. Local server only
 * (see note above) — this is now a single, authoritative delete, so a
 * deleted video will not reappear after a reload.
 */
export const deleteVideoFromFirestore = async (
  id: string,
  storagePath?: string,
  thumbnailStoragePath?: string
): Promise<void> => {
  if (storagePath) {
    await deleteVideoFromFirebase(storagePath);
  }
  if (thumbnailStoragePath) {
    await deleteVideoFromFirebase(thumbnailStoragePath);
  }

  try {
    await fetchApi(`/videos/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.error('Failed to delete video record:', e);
    throw e instanceof Error ? e : new Error('Failed to delete video.');
  }
};

/**
 * Toggle Video Published / Unpublished status — local server only.
 */
export const toggleVideoStatusInFirestore = async (
  id: string,
  status: 'published' | 'unpublished'
): Promise<void> => {
  await fetchApi(`/videos/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
};
