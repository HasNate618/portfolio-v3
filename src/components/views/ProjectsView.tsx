import { site, awardFor, byScore, byDate } from "@/data/site";
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
  archive: "Archive",
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

      <details id="archive" className="mt-16">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-fg hover:text-accent">
          Archive: earlier builds and team hackathon projects
        </summary>
        <ArchiveTable projects={byGroup("archive").sort(byDate)} />
      </details>

      <h2 id="hackathon-awards" className="section-label mt-16">
        Hackathon awards
      </h2>
      <div className="mt-6">
        <AwardsTable />
      </div>
    </article>
  );
}

function yearOf(dates: string): string {
  return dates.match(/\d{4}/)?.[0] ?? dates;
}

function ArchiveTable({ projects }: { projects: Project[] }) {
  return (
    <>
      <ul className="mt-6 flex flex-col gap-4 sm:hidden">
        {projects.map((project) => {
          const award = awardFor(project.name);
          const link = project.links[0];
          return (
            <li key={project.id} className="border-t border-rule pt-4">
              <p className="font-medium text-fg">{project.name}</p>
              <p className="text-sm text-muted">
                {yearOf(project.dates)}
                {project.event ? ` · ${project.event}` : ""}
              </p>
              {award ? <p className="text-sm">{award.prize}</p> : null}
              <p className="mt-1 text-xs text-muted">{project.displayRole}</p>
              {link ? (
                <p className="mt-1 text-sm">
                  <a href={link.href} className="text-accent hover:text-fg">
                    {link.label}
                  </a>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 hidden sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Archive: earlier builds and team hackathon projects
          </caption>
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Project</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Year</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Event</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Award</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Role</th>
              <th scope="col" className="py-2 font-semibold text-fg">Link</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const award = awardFor(project.name);
              const link = project.links[0];
              return (
                <tr key={project.id} className="border-b border-rule align-top">
                  <th scope="row" className="py-3 pr-4 font-normal text-fg">{project.name}</th>
                  <td className="py-3 pr-4 text-muted">{yearOf(project.dates)}</td>
                  <td className="py-3 pr-4">{project.event ?? ""}</td>
                  <td className="py-3 pr-4">{award?.prize ?? ""}</td>
                  <td className="py-3 pr-4">{project.displayRole}</td>
                  <td className="py-3">
                    {link ? (
                      <a href={link.href} className="text-accent hover:text-fg">
                        {link.label}
                      </a>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
