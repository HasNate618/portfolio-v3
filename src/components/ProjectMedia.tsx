import Image from "next/image";
import type { ProjectMedia as Media } from "@/data/site";
import { slugify } from "@/lib/markdown";

/**
 * A project's images as a row of small, uniform thumbnails, at desktop widths
 * only. Every image renders at the same size regardless of its intrinsic
 * dimensions — the box is fixed and `object-cover` crops — so a row of two and a
 * row of four still line up.
 *
 * Clicking one opens it expanded, in place. The mechanism is CSS `:target`
 * rather than script: the thumbnail links to the overlay's fragment, the overlay
 * is revealed while that fragment is the target, and the back button closes it.
 * So the expansion works with JavaScript off, and nothing animates. The close
 * link targets the thumbnail's own id, which puts the reader back where they
 * were rather than at the top of the page.
 */
export function ProjectMedia({
  media,
  className = "",
  limit,
}: {
  media?: Media[];
  className?: string;
  /**
   * Thumbnails to show. The rest still get an expanded view, reached by the
   * "Next image" link in each caption, so a compact card hides no picture.
   */
  limit?: number;
}) {
  if (!media?.length) return null;
  const shown = limit ? Math.min(limit, media.length) : media.length;
  const ids = media.map((item) => `media-${slugify(item.src)}`);

  /*
   * Phone widths get no images. The thumbnail is a 160x96 crop, so for a tall
   * screenshot it is a fragment of the picture rather than a preview of it, and
   * the row pushed the text a reader came for further down a narrow page.
   *
   * Hidden rather than left unrendered because the markup has to be identical at
   * every width on a site that renders without script, and because next/image
   * marks these lazy: an image with no box is never fetched, so a phone does not
   * download them either.
   */
  return (
    <ul className={`flex flex-wrap gap-2 max-lg:hidden ${className}`}>
      {media.map((item, index) => {
        const id = ids[index];
        const hasThumb = index < shown;
        // A hidden image closes back to the first thumbnail, the one the reader opened.
        const thumbId = hasThumb ? `${id}-thumb` : `${ids[0]}-thumb`;
        const next = shown < media.length ? ids[(index + 1) % media.length] : undefined;

        return (
          <li key={item.src} className={hasThumb ? undefined : "contents"}>
            {/*
             * The image's own alt is the link's name: an aria-label saying
             * "Expand:" would replace the description with an instruction.
             */}
            {hasThumb ? (
              <a id={thumbId} href={`#${id}`} className="relative z-10 block cursor-zoom-in">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="160px"
                  className={`h-24 w-40 rounded-lg border border-rule transition-colors hover:border-accent ${
                    item.contain ? "bg-black/20 object-contain" : "object-cover"
                  }`}
                />
              </a>
            ) : null}

            {/*
             * The expanded view. Hidden until its fragment is targeted; the
             * backdrop is one full-bleed close link, so a click anywhere outside
             * the image dismisses it.
             */}
            <div id={id} className="lightbox" tabIndex={-1}>
              <a
                href={`#${thumbId}`}
                className="lightbox-backdrop"
                aria-label="Close the expanded image"
              />
              <figure className="lightbox-frame">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="90vw"
                  className={`max-h-[80vh] max-w-[92vw] rounded-lg border border-rule ${
                    item.contain ? "bg-black/20 object-contain" : "object-cover"
                  }`}
                />
                <figcaption className="mt-3 max-w-[60ch] text-center text-sm text-muted">
                  {item.alt}.{" "}
                  <a
                    href={item.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:text-fg"
                  >
                    Open the full-size file
                  </a>
                  {next ? (
                    <>
                      {" "}
                      <span aria-hidden="true">·</span>{" "}
                      <a href={`#${next}`} className="font-medium text-accent hover:text-fg">
                        Next image ({((index + 1) % media.length) + 1} of {media.length})
                      </a>
                    </>
                  ) : null}
                </figcaption>
              </figure>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
