import Link from "next/link";
import { getProject } from "@/data/site";
import { caseStudyHref } from "@/lib/content";

/**
 * A project's outward doors, in reading order: the case study first, then the
 * external links from site.ts. Most projects have a knowledgebase file but no
 * case-study page, so the study link only appears when the route really
 * exists — and never when it would point at the page already being read.
 */
export function LinkRow({ projectId, selfHref }: { projectId: string; selfHref?: string }) {
  const project = getProject(projectId);
  if (!project) return null;

  const study = caseStudyHref(project);
  const showStudy = study !== null && study !== selfHref;
  if (!showStudy && project.links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-4">
      {showStudy ? (
        <li>
          <Link href={study} className="font-medium text-accent hover:text-fg">
            Case study <span aria-hidden="true">→</span>
          </Link>
        </li>
      ) : null}
      {project.links.map((link) => (
        <li key={link.href}>
          <a href={link.href} className="font-medium text-accent hover:text-fg">
            {link.label} <span aria-hidden="true">→</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
