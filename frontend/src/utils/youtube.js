const buildEmbedParams = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1`;

export const getYouTubeId = (url = '') => {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([^&]+)/i);
  if (longMatch) return longMatch[1];
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch) return embedMatch[1];
  return null;
};

export const buildYouTubeEmbedUrl = (videoId) => {
  if (!videoId) return null;
  return buildEmbedParams(videoId);
};

export const getYouTubePlaylistId = (url = '') => {
  if (!url) return null;
  const match = url.match(/[?&]list=([^&]+)/i);
  return match ? match[1] : null;
};
