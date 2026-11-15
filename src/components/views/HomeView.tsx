import Link from "next/link";
import { site, featuredProjects, leadProject, alsoBuiltProjects, awardFor, type Project } from "@/data/site";
import { projectLinks } from "@/lib/project-links";
import { renderMarkdown, stripLeadingH1 } from "@/lib/markdown";
import { getPage, type Page } from "@/lib/content";
import { cardLineFor } from "@/components/CompactProjectCard";
import { ProjectMedia } from "@/components/ProjectMedia";

/**
 * The home page carries the whole story: who he is, the newest roles, then the
 * projects worth leading with. It is deliberately text-first — no cards, no
 * boxes, no hairline buttons — but each project keeps one image, because a
 * list of names alone gave no sense of what the work looks like.
 *
 * The ids on these sections are still load-bearing: the page's own "on this
 * page" list and any in-page link resolve against them, so renaming one breaks
 * a link. The header nav no longer points here — it goes to /experience and
 * /projects — so these are anchors, not navigation.
 *
 * Experience is deliberately partial here: the newest roles, then a link to
 * the full record. Five roles with their summaries pushed the projects — the
 * actual proof — far down the page.
 */
const HOME_ROLES = 2;

/** One entry of the home project list: image, linked name, dates, award, one line. */
function ProjectLine({ project, anchor }: { project: Project; anchor?: string }) {
  const link = projectLinks(project.id)[0];
  const award = awardFor(project.name);
  const name = link ? (
    link.internal ? (
      <Link href={link.href} className="hover:text-accent">
        {project.name}
      </Link>
    ) : (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
        {project.name}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  ) : (
    project.name
  );
  return (
    <li id={anchor}>
      {/* One image above the text. Every image the project has stays reachable
          through the expanded view the thumbnail opens. */}
      <ProjectMedia media={project.media} variant="hero" className="mb-3" />
      <p>
        <span className="font-medium text-fg">{name}</span>
        <span className="text-muted"> · {project.dates}</span>
        {award ? <span className="font-medium text-accent"> · {award.prize}</span> : null}
      </p>
      <p className="mt-0.5 max-w-[68ch] leading-relaxed">{cardLineFor(project)}</p>
    </li>
  );
}

export function HomeView({ page }: { page: Page }) {
  const projects = [leadProject()!, ...featuredProjects()];

  /**
   * Only roles that actually have a case study route link out. Deriving the slug
   * from the corpus path keeps this honest: a role with no page renders as plain
   * text rather than as a link that 404s.
   */
  const caseStudyHref = (file?: string) => {
    if (!file) return null;
    const slug = file.split("/").pop()?.replace(/\.md$/, "");
    if (!slug) return null;
    const route = `/experience/${slug}`;
    return getPage(route) ? route : null;
  };

  return (
    <article>
      {/* The sidebar already shows the name at this size, so keep the heading for structure only. */}
      <h1 className="sr-only">{page.title}</h1>

      <p className="max-w-[68ch] text-fg">
        {site.identity.year} in {site.identity.program} at {site.identity.education.school}, graduating{" "}
        {site.identity.graduation}. Looking for a{" "}
        {site.identity.seeking}.
      </p>

      <div
        className="rich-text mt-6 max-w-[68ch] leading-relaxed"
        // pi-lens-ignore: dangerouslySetInnerHTML
        dangerouslySetInnerHTML={{ __html: renderMarkdown(stripLeadingH1(page.body, page.title)) }}
      />

      <h2 id="experience" className="section-label mt-16">
        Experience
      </h2>
      <ul className="mt-6 flex flex-col gap-4">
        {site.experience.slice(0, HOME_ROLES).map((experience) => {
          const href = caseStudyHref(experience.file);
          return (
            <li key={experience.org}>
              {/* The dates used to sit in a 10rem column of their own, which
                  made every row shift sideways as the reader scanned it. Above
                  the role they read as a timestamp and the row stays one column. */}
              <p className="text-sm text-muted">{experience.dates}</p>
              <div className="mt-1">
                <p>
                  <span className="font-medium text-fg">{experience.role}</span>
                  <span className="text-muted"> · {experience.org}</span>
                </p>
                {/* Two lines here; the full summary and location live on /experience. */}
                {experience.homeLine ?? experience.summary ? (
                  <p className="mt-1 max-w-[68ch] leading-relaxed">{experience.homeLine ?? experience.summary}</p>
                ) : null}
                {href ? (
                  <p className="mt-1">
                    <Link href={href} className="text-accent hover:text-fg">
                      Case study
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {/* The newest roles only; the whole record lives on its own page. */}
      <p className="mt-6">
        <Link href="/experience" className="font-medium text-accent hover:text-fg">
          All experience <span aria-hidden="true">→</span>
        </Link>
      </p>

      <h2 id="projects" className="section-label mt-16">
        Projects
      </h2>

      {/*
       * A text list with one image per project: the name links out (case study
       * first), one line of what it is. No card boxes, no stack chips, no link
       * rows — the full cards live on /projects.
       */}
      <ul className="mt-6 flex flex-col gap-10">
        {projects.map((project) => (
          <ProjectLine key={project.id} project={project} anchor={project.rank === "lead" ? project.id : undefined} />
        ))}
      </ul>

      {/*
       * One line for the work the list above doesn't show, so the page doesn't
       * read as AI only. The kind tag keeps the spread visible without cards.
       */}
      <p id="also-built" className="mt-8 max-w-[68ch] leading-relaxed">
        <span className="text-muted">Also built: </span>
        {alsoBuiltProjects().map(({ project, kind }, index, all) => {
          const link = projectLinks(project.id)[0];
          return (
            <span key={project.id}>
              {link ? (
                link.internal ? (
                  <Link href={link.href} className="text-accent hover:text-fg">
                    {project.name}
                  </Link>
                ) : (
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-fg">
                    {project.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )
              ) : (
                project.name
              )}{" "}
              <span className="text-muted">({kind.toLowerCase()})</span>
              {index < all.length - 1 ? ", " : "."}
            </span>
          );
        })}
      </p>

      {/* The way to the full index. */}
      <p className="mt-6">
        <Link href="/projects" className="font-medium text-accent hover:text-fg">
          All projects <span aria-hidden="true">→</span>
        </Link>
      </p>

      {/*
       * Awards close the page in one line: the hackathon count, the Dean's
       * Honour List years (from the education entry, so the two can never
       * disagree) and a link to the full table on /projects.
       */}
      <h2 id="awards" className="section-label mt-16">
        Awards
      </h2>
      <p className="mt-4 max-w-[68ch] leading-relaxed">
        {site.hackathons.awards} awards across {site.hackathons.entered} hackathons.{" "}
        {site.identity.education.honors} at {site.identity.education.school}.{" "}
        <Link href="/projects#hackathon-awards" className="font-medium text-accent hover:text-fg">
          Full list <span aria-hidden="true">→</span>
        </Link>
      </p>
    </article>
  );
}
