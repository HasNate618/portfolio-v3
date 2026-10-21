import { getProject } from "@/data/site";
import { caseStudyHref } from "@/lib/content";

/** A project's outward doors, in the order a card lists them. */
export type ProjectLink = {
  label: string;
  href: string;
  internal: boolean;
};

/**
 * The case study comes first when a route exists, then the external links from
 * site.ts. `selfHref` keeps a case-study page from linking to itself.
 */
export function projectLinks(projectId: string, selfHref?: string): ProjectLink[] {
  const project = getProject(projectId);
  if (!project) return [];

  const links: ProjectLink[] = [];
  const study = caseStudyHref(project);
  if (study && study !== selfHref) {
    links.push({ label: "Case study", href: study, internal: true });
  }
  for (const link of project.links) {
    links.push({ label: link.label, href: link.href, internal: false });
  }
  return links;
}
