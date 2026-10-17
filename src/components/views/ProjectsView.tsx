import Link from "next/link";
import { site, awardFor } from "@/data/site";
import type { Project, ProjectGroup } from "@/data/site";
import { renderMarkdown, slugify } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { StatRow } from "@/components/StatRow";
import { StackList } from "@/components/StackList";
import { LinkRow } from "@/components/LinkRow";
import { ProjectMedia } from "@/components/ProjectMedia";
import { AwardBadge } from "@/components/AwardBadge";

/**
 * The draft's headings are lowercase slugs (`## ~/also-building`), so the
 * capitalized label has to come from here rather than from heading text.
 */
export const GROUP_LABELS: Record<ProjectGroup, string> = {
  featured: "Featured",
  "also-building": "Also building",
  "ai-ml": "AI and ML",
  team: "Hackathon team projects",
  hardware: "Hardware",
  "web-mobile": "Web and mobile",
  games: "Games and smaller builds",
};

const OPEN_GROUPS: ProjectGroup[] = [
  "featured",
  "also-building",
  "ai-ml",
  "team",
  "hardware",
  "web-mobile",
];

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
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />

      {OPEN_GROUPS.map((group) => (
        <section key={group} className="mt-16">
          <h2 id={groupId(group)} className="section-label">
            {GROUP_LABELS[group]}
          </h2>
          <ul className="mt-6 flex flex-col gap-6">
            {byGroup(group).map((project) => (
              <ProjectCard key={project.id} project={project} showStats={group === "featured"} />
            ))}
          </ul>
        </section>
      ))}

      {/* The awards table lives at the bottom of the home page now; this page
          only carries the badges on the cards that won. */}

      {/* Eight games would bury the rest of the page; a native disclosure keeps
          them reachable without JavaScript. */}
      <details className="mt-16">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-fg hover:text-accent">
          {GROUP_LABELS.games}
        </summary>
        <ul className="mt-6 flex flex-col gap-6">
          {byGroup("games").map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      </details>
    </article>
  );
}

function ProjectCard({ project, showStats }: { project: Project; showStats?: boolean }) {
  // TeraGo's case study is experience data and lives under /experience.
  // The ten projects with no content file have no case study to link to.
  const href = project.id === "terago" ? "/experience/terago" : project.file ? `/projects/${project.id}` : null;
  const award = awardFor(project.name);

  return (
    /*
     * A winning card wears the win on its frame, not just in a badge: the
     * accent-tinted border and fill set it apart from the plain cards before
     * a word is read.
     */
    <li
      className={`rounded-lg border p-6 transition-colors ${
        award
          ? "border-accent/50 bg-accent/5 hover:border-accent"
          : "border-rule bg-surface hover:border-accent/40"
      }`}
    >
      <h3 className="text-lg font-medium leading-snug text-fg">
        {href ? (
          <Link href={href} className="hover:text-accent">
            {project.name}
          </Link>
        ) : (
          project.name
        )}
      </h3>
      <div className="mt-1">
        <ProjectMetaRow projectId={project.id} />
      </div>
      <AwardBadge projectName={project.name} />
      <p className="mt-2 max-w-[68ch] leading-relaxed">{project.covers}</p>
      <ProjectMedia media={project.media} className="mt-4 max-w-xl" />
      {showStats ? (
        <div className="mt-4">
          <StatRow projectId={project.id} />
        </div>
      ) : null}
      <div className="mt-4">
        <StackList projectId={project.id} />
      </div>
      <div className="mt-4">
        <LinkRow projectId={project.id} />
      </div>
      {/* A title alone does not say there is more to read; name the case study. */}
      {href ? (
        <p className="mt-4 text-sm">
          <Link href={href} className="font-medium text-accent hover:text-fg">
            Read the case study <span aria-hidden="true">→</span>
          </Link>
        </p>
      ) : null}
    </li>
  );
}
