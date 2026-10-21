import Link from "next/link";
import { projectLinks } from "@/lib/project-links";

/**
 * A project's outward doors, in reading order: the case study first, then the
 * external links from site.ts. Most projects have a knowledgebase file but no
 * case-study page, so the study link only appears when the route really
 * exists — and never when it would point at the page already being read.
 *
 * The list sits above a card's stretched title link so each door keeps its own
 * target.
 */
export function LinkRow({ projectId, selfHref }: { projectId: string; selfHref?: string }) {
  const links = projectLinks(projectId, selfHref);
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-4">
      {links.map((link) => (
        <li key={link.href}>
          {link.internal ? (
            <Link href={link.href} className="relative z-10 font-medium text-accent hover:text-fg">
              {link.label} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 font-medium text-accent hover:text-fg"
            >
              {link.label} <span aria-hidden="true">→</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
