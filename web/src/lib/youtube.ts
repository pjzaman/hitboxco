/**
 * Tiny client + server helper for YouTube URLs (Layer 2 — feed video).
 *
 * The Cloud Function validates URLs on write and stores the URL as-is.
 * Renderers call `extractYouTubeId` to derive the ID for an iframe
 * embed. We use the privacy-enhanced `youtube-nocookie.com` host so
 * YouTube doesn't drop tracking cookies until the viewer hits play.
 */

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns: RegExp[] = [
    /^https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/,
    /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?[^#]*\bv=([A-Za-z0-9_-]{11})/,
    /^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`;
}
