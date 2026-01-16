/**
 * VideoEmbed
 *
 * Lightweight wrapper for embedding onboarding videos.
 *
 * NOTE: We intentionally accept only a full embed URL (e.g. https://www.youtube.com/embed/VIDEO_ID)
 * to avoid dealing with provider-specific parsing.
 */

'use client'

export function VideoEmbed({
  title,
  embedUrl,
}: {
  title: string
  /** A full embed URL (YouTube/Vimeo/etc) */
  embedUrl: string
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>
      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
        <iframe
          className="h-full w-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Si quieres, reemplazo este video por tu propio tutorial (YouTube/Vimeo) cuando me pases los links.
      </p>
    </div>
  )
}
