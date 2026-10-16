import Image from "next/image";
import type { ProjectMedia as Media } from "@/data/site";

/**
 * A project's images as a row of small, uniform thumbnails. Every image renders
 * at the same size regardless of its intrinsic dimensions — the box is fixed and
 * `object-cover` crops — so a row of two and a row of four still line up.
 */
export function ProjectMedia({ media, className = "" }: { media?: Media[]; className?: string }) {
  if (!media?.length) return null;

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {media.map((item) => (
        <li key={item.src}>
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            sizes="128px"
            className={`h-20 w-32 rounded border border-rule ${
              item.contain ? "bg-black/20 object-contain" : "object-cover"
            }`}
          />
        </li>
      ))}
    </ul>
  );
}
