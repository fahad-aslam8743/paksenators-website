import React from 'react';

/** True if this URL is a YouTube watch/embed link (vs. a direct video file). */
export const isYouTubeUrl = (url: string): boolean =>
  !!url && (url.includes('youtube.com/embed/') || url.includes('youtube.com/watch') || url.includes('youtu.be/'));

/** Extracts the 11-character YouTube video ID from any common YouTube URL shape. */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
};

interface VideoPlayerProps {
  videoUrl: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  title?: string;
}

/**
 * Renders a video regardless of whether it's YouTube-hosted or a direct
 * file URL. A plain <video> tag cannot play a YouTube link (YouTube serves
 * a player page there, not a raw video stream) — it just spins forever —
 * so YouTube URLs are routed to an <iframe> embed instead, which is the
 * only way browsers can actually play them.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  className = 'w-full h-full',
  autoPlay = false,
  controls = true,
  title = 'Video player'
}) => {
  if (isYouTubeUrl(videoUrl)) {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!videoId) return null;
    const params = new URLSearchParams({
      autoplay: autoPlay ? '1' : '0',
      rel: '0',
      modestbranding: '1'
    });
    return (
      <iframe
        key={videoId}
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        className={className}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      key={videoUrl}
      src={videoUrl}
      controls={controls}
      autoPlay={autoPlay}
      controlsList="nodownload"
      className={className}
    />
  );
};
