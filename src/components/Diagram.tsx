import type { ReactNode } from "react";

/**
 * ASCII diagram. The <pre> is hidden from assistive tech and the caption
 * carries the meaning, so a screen reader gets prose instead of punctuation.
 * overflow-x-auto keeps a wide diagram from forcing the page sideways at 360px.
 */
export function Diagram({ children, alt }: { children: ReactNode; alt: string }) {
  return (
    <figure className="my-6">
      <pre
        aria-hidden="true"
        className="overflow-x-auto rounded border border-rule bg-black/30 p-4 text-xs leading-relaxed text-fg"
      >
        {children}
      </pre>
      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  );
}
