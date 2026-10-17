import Image from "next/image";
import type { ProjectMedia as Media } from "@/data/site";
import { slugify } from "@/lib/markdown";

/**
 * A project's images as a row of small, uniform thumbnails. Every image renders
 * at the same size regardless of its intrinsic dimensions — the box is fixed and
 * `object-cover` crops — so a row of two and a row of four still line up.
 *
 * Clicking one opens it expanded, in place. The mechanism is CSS `:target`
 * rather than script: the thumbnail links to the overlay's fragment, the overlay
 * is revealed while that fragment is the target, and the back button closes it.
 * So the expansion works with JavaScript off, and nothing animates. The close
 * link targets the thumbnail's own id, which puts the reader back where they
 * were rather than at the top of the page.
 */
export function ProjectMedia({ media, className = "" }: { media?: Media[]; className?: string }) {
  if (!media?.length) return null;

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {media.map((item) => {
        const id = `media-${slugify(item.src)}`;
        const thumbId = `${id}-thumb`;

        return (
          <li key={item.src}>
            {/*
             * The image's own alt is the link's name: an aria-label saying
             * "Expand:" would replace the description with an instruction.
             */}
            <a id={thumbId} href={`#${id}`} className="block cursor-zoom-in">
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
                </figcaption>
              </figure>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
