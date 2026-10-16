import { slugify } from "@/lib/markdown";

/** Anchors use the same slugify renderMarkdown uses for heading ids. */
export function OnThisPage({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page" className="rounded-lg border border-rule bg-white/[0.02] p-5 text-sm">
      <h2 className="section-label">On this page</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item}>
            <a href={`#${slugify(item)}`} className="text-muted hover:text-accent">
              {item}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
