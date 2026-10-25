import { site, byScore } from "@/data/site";
import type { Project, ProjectGroup } from "@/data/site";
import { renderMarkdown, slugify, stripLeadingH1 } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ProjectCard } from "@/components/ProjectCard";
import { CompactProjectCard } from "@/components/CompactProjectCard";
import { AwardsTable } from "@/components/AwardsTable";

/**
 * The draft's headings are lowercase slugs (`## ~/also-building`), so the
 * capitalized label has to come from here rather than from heading text.
 */
export const GROUP_LABELS: Record<ProjectGroup, string> = {
  featured: "Case studies",
  ai: "AI and LLM",
  hardware: "Hardware and embedded",
  xr: "AR and VR",
  tools: "Tools and apps",
  games: "Games",
};

/**
 * Three open sections on the page. The case studies keep the full card and
 * their hand-set `order`; the rest share a compact grid with no stack chips,
 * under two merged headings, strongest first by `score` in site.ts. Software
 * comes before hardware because the page is read for SWE internships.
 */
export const SECTIONS: { label: string; groups: ProjectGroup[]; compact: boolean }[] = [
  { label: GROUP_LABELS.featured, groups: ["featured"], compact: false },
  { label: "Software, AI and games", groups: ["ai", "tools", "games"], compact: true },
  { label: "Hardware, AR and VR", groups: ["hardware", "xr"], compact: true },
];

function byGroup(group: ProjectGroup): Project[] {
  return site.projects.filter((p) => p.group === group).sort((a, b) => a.order - b.order);
}

/** Projects in a section: case studies by `order`, compact sections by score. */
function inSection(section: { groups: ProjectGroup[]; compact: boolean }): Project[] {
  const projects = section.groups.flatMap(byGroup);
  return section.compact ? projects.sort(byScore) : projects;
}

export function ProjectsView({ page }: { page: Page }) {
  return (
    <article>
      <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>

      <div
        className="rich-text mt-6 max-w-[68ch] leading-relaxed"
        // pi-lens-ignore: dangerouslySetInnerHTML
        dangerouslySetInnerHTML={{ __html: renderMarkdown(stripLeadingH1(page.body, page.title)) }}
      />

      {/*
       * Heading ids are slugify(label) so that OnThisPage, which slugifies the
       * same labels, cannot produce a dangling anchor.
       */}
      {SECTIONS.map((section) => (
        <section key={section.label} className="mt-16">
          <h2 id={slugify(section.label)} className="section-label">
            {section.label}
          </h2>
          {section.compact ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {inSection(section).map((project) => (
                <CompactProjectCard key={project.id} project={project} variant="grid" />
              ))}
            </ul>
          ) : (
            <ul className="mt-6 flex flex-col gap-6">
              {inSection(section).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </ul>
          )}
        </section>
      ))}

      <h2 id="hackathon-awards" className="section-label mt-16">
        Hackathon awards
      </h2>
      <div className="mt-6">
        <AwardsTable />
      </div>
    </article>
  );
}
