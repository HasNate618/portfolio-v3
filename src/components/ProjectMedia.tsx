import Image from "next/image";
import type { ProjectMedia as Media } from "@/data/site";

/**
 * Images for a project. The lead image is full width; any others sit in a pair
 * beneath it. Widths and heights are the real intrinsic sizes (captured during
 * the v2 port), so nothing reflows while the image loads.
 */
export function ProjectMedia({ media, className = "" }: { media?: Media[]; className?: string }) {
  if (!media?.length) return null;
  const [lead, ...rest] = media;

  const imgClass = (contain?: boolean) =>
    `h-auto w-full rounded border border-rule ${
      contain ? "bg-black/20 object-contain" : "object-cover"
    }`;

  return (
    <div className={className}>
      <Image
        src={lead.src}
        alt={lead.alt}
        width={lead.width}
        height={lead.height}
        sizes="(min-width: 1024px) 640px, 100vw"
        className={imgClass(lead.contain)}
      />
      {rest.length > 0 ? (
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rest.map((item) => (
            <li key={item.src}>
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(min-width: 1024px) 320px, 50vw"
                className={imgClass(item.contain)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
