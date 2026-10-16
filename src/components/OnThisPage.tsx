import { slugify } from "@/lib/markdown";

/** Anchors use the same slugify renderMarkdown uses for heading ids. */
export function OnThisPage({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-fg">On this page</h2>
      <ul className="mt-4 flex flex-col gap-2">
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
