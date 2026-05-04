import { extractYouTubeId, youTubeEmbedUrl } from "@/lib/youtube";

/**
 * Render a 16:9 YouTube iframe for a stored videoUrl. Returns null if
 * the URL doesn't parse as a YouTube link (in which case the caller
 * should fall back to a static image or hide the slot).
 */
export function YouTubeEmbed({
  videoUrl,
  title = "Video",
  className = "",
}: {
  videoUrl: string | null | undefined;
  title?: string;
  className?: string;
}) {
  const id = extractYouTubeId(videoUrl);
  if (!id) return null;
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-white/5 ${className}`}
      style={{ aspectRatio: "16 / 9" }}
    >
      <iframe
        src={youTubeEmbedUrl(id)}
        title={title}
        className="absolute inset-0 w-full h-full"
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
