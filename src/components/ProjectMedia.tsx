import Image from "next/image";
import type { ProjectMedia as Media } from "@/data/site";

/**
 * A project's images as a row of small, uniform thumbnails. Every image renders
 * at the same size regardless of its intrinsic dimensions — the box is fixed and
 * `object-cover` crops — so a row of two and a row of four still line up.
 *
 * Each thumbnail links to the full-size file. That is the whole lightbox:
 * a plain anchor to a mounted file, so it works with JavaScript off, and the
 * reader gets the image at native resolution in a new tab.
 */
export function ProjectMedia({ media, className = "" }: { media?: Media[]; className?: string }) {
  if (!media?.length) return null;

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {media.map((item) => (
        <li key={item.src}>
          <a
            href={item.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.alt} (opens full size)`}
            className="block"
          >
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
        </li>
      ))}
    </ul>
  );
}
