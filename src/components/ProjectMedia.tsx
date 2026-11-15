import Image from "next/image";
import type { ProjectMedia as Media } from "@/data/site";
import { slugify } from "@/lib/markdown";

/** Small squares beside the main image on a compact card, at most. */
const CARD_MINIS = 4;

/**
 * A project's images, and an expanded view for each one.
 *
 * `variant="row"` (full cards and case studies) shows every image as a
 * uniform 160x96 thumbnail. On wide screens they wrap onto more rows; on
 * phones they stay on one row that scrolls sideways, so the card is only one
 * thumbnail taller.
 *
 * `variant="card"` (compact cards) shows the main image at the same size with
 * up to four small squares beside it, so the card is no taller than one
 * thumbnail. If there are more images than fit, the last square says "+N"
 * and opens the first image it leaves out. Pass `large` where the card has room
 * for a picture rather than a thumbnail: the main image then spans the card and
 * the squares move to a row under it.
 *
 * Every thumbnail opens its image expanded, in place. The mechanism is CSS
 * `:target` rather than script, so it works with JavaScript off: the thumbnail
 * links to the overlay's fragment, and the overlay shows while that fragment
 * is the target. Each overlay has previous and next links and a counter, so
 * the reader can walk through every image of the project from any one of
 * them. LightboxKeys adds Escape, the arrow keys and swipe on top.
 */
export function ProjectMedia({
  media,
  className = "",
  variant = "row",
  large = false,
}: {
  media?: Media[];
  className?: string;
  variant?: "row" | "card";
  /** Card only: span the card with the main image instead of thumbnailing it. */
  large?: boolean;
}) {
  if (!media?.length) return null;

  const ids = media.map((item) => `media-${slugify(item.src)}`);
  const thumbId = (index: number) => `${ids[index]}-thumb`;
  const count = media.length;

  // On a card: the main image, then the squares. A last square with more
  // images behind it becomes "+N".
  const minis = variant === "card" ? Math.min(count - 1, CARD_MINIS) : 0;
  const overflow = variant === "card" ? count - 1 - minis : 0;
  const hasThumb = (index: number) => (variant === "row" ? true : index <= minis);

  const thumbnail = (item: Media, index: number, size: "main" | "mini" | "large", label?: string) => (
    <a
      id={thumbId(index)}
      href={`#${ids[index]}`}
      className="relative z-10 block cursor-zoom-in"
      aria-label={label}
    >
      <Image
        src={item.src}
        alt={label ? "" : item.alt}
        width={item.width}
        height={item.height}
        sizes={size === "large" ? "(min-width: 40rem) 24rem, 90vw" : size === "main" ? "160px" : "56px"}
        className={`rounded-lg border border-rule transition-colors hover:border-accent ${
          size === "large" ? "h-auto w-full" : size === "main" ? "h-24 w-40" : "h-[2.75rem] w-14"
        } ${item.contain ? "bg-black/20 object-contain" : "object-cover"}`}
      />
      {label ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 text-xs font-bold text-white"
        >
          +{overflow + 1}
        </span>
      ) : null}
    </a>
  );

  return (
    <div className={className}>
      {variant === "row" ? (
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {media.map((item, index) => (
            <li key={item.src} className="shrink-0">{thumbnail(item, index, "main")}</li>
          ))}
        </ul>
      ) : (
        <div className={large ? "flex flex-col gap-2" : "flex gap-2"}>
          {thumbnail(media[0], 0, large ? "large" : "main")}
          {minis > 0 ? (
            <ul
              className={
                large
                  ? "flex flex-wrap gap-2"
                  : "grid grid-cols-2 content-start gap-x-1 gap-y-2"
              }
              aria-label="More images"
            >
              {media.slice(1, minis + 1).map((item, offset) => {
                const index = offset + 1;
                const isMore = overflow > 0 && index === minis;
                return (
                  <li key={item.src}>
                    {thumbnail(item, index, "mini", isMore ? `${overflow + 1} more images, starting with ${item.alt}` : undefined)}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}

      {media.map((item, index) => {
        const id = ids[index];
        // An image with no thumbnail of its own closes back to the main one.
        const back = hasThumb(index) ? thumbId(index) : thumbId(0);
        const prev = ids[(index - 1 + count) % count];
        const next = ids[(index + 1) % count];
        return (
          <div
            key={item.src}
            id={id}
            className="lightbox"
            tabIndex={-1}
            role="dialog"
            aria-label={`${item.alt}, image ${index + 1} of ${count}`}
            data-thumb={back}
            data-prev={count > 1 ? prev : undefined}
            data-next={count > 1 ? next : undefined}
          >
            <a href={`#${back}`} className="lightbox-backdrop" aria-label="Close the expanded image" />
            <figure className="lightbox-frame">
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="90vw"
                className={`max-h-[75vh] max-w-[92vw] rounded-lg border border-rule ${
                  item.contain ? "bg-black/20 object-contain" : "object-cover"
                }`}
              />
              <figcaption className="mt-3 max-w-[60ch] text-center text-sm text-white/80">
                {count > 1 ? (
                  <span className="mr-2 font-bold text-white">
                    {index + 1} / {count}
                  </span>
                ) : null}
                {item.alt}.{" "}
                <a
                  href={item.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white underline hover:text-accent"
                >
                  Open the full-size file
                </a>
              </figcaption>
            </figure>
            {count > 1 ? (
              <>
                <a href={`#${prev}`} className="lightbox-nav lightbox-prev" aria-label="Previous image">
                  <span aria-hidden="true">‹</span>
                </a>
                <a href={`#${next}`} className="lightbox-nav lightbox-next" aria-label="Next image">
                  <span aria-hidden="true">›</span>
                </a>
              </>
            ) : null}
            <a href={`#${back}`} className="lightbox-close" aria-label="Close the expanded image">
              <span aria-hidden="true">×</span>
            </a>
          </div>
        );
      })}
    </div>
  );
}
