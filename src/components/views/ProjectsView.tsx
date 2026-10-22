import { site, awardFor } from "@/data/site";
import type { Project, ProjectGroup } from "@/data/site";
import { renderMarkdown, slugify, stripLeadingH1 } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ProjectCard } from "@/components/ProjectCard";
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
 * Hardware and XR come before AI so the page shows range before the area the
 * case studies already cover.
 */
const OPEN_GROUPS: ProjectGroup[] = ["featured", "hardware", "xr", "ai", "tools", "games"];

function byGroup(group: ProjectGroup): Project[] {
  return site.projects.filter((p) => p.group === group).sort((a, b) => a.order - b.order);
}

/**
 * Heading ids are slugify(label) so that OnThisPage, which slugifies the same
 * labels, cannot produce a dangling anchor.
 */
function groupId(group: ProjectGroup): string {
  return slugify(GROUP_LABELS[group]);
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

      {OPEN_GROUPS.map((group) => (
        <section key={group} className="mt-16">
          <h2 id={groupId(group)} className="section-label">
            {GROUP_LABELS[group]}
          </h2>
          <ul className="mt-6 flex flex-col gap-6">
            {byGroup(group).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ul>
        </section>
      ))}

      <details id="archive" className="mt-16">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-fg hover:text-accent">
          Archive: earlier builds and team hackathon projects
        </summary>
        <ArchiveTable projects={byGroup("archive")} />
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
