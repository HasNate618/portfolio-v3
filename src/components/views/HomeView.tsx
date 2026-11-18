import Link from "next/link";
import { site, featuredProjects, leadProject } from "@/data/site";
import { renderMarkdown, stripLeadingH1 } from "@/lib/markdown";
import { getPage, type Page } from "@/lib/content";
import { ProjectCard } from "@/components/ProjectCard";
import { REST_OF_PROJECTS } from "@/components/views/ProjectsView";

/**
 * The home page carries the whole story: who he is, the newest roles, then the
 * projects worth leading with. The projects use the same card as the case
 * studies on /projects: full width, the whole `covers` paragraph, one lead image
 * and the stack, so home shows the work rather than a teaser for it.
 *
 * The ids on these sections are still load-bearing: the page's own "on this
 * page" list and any in-page link resolve against them, so renaming one breaks
 * a link. The header nav no longer points here — it goes to /experience and
 * /projects — so these are anchors, not navigation.
 *
 * Experience is the whole record now, not a trimmed preview: the /experience
 * index is gone and the header points at this section, so every role is here
 * with its bullets and a link to its case study where one exists.
 */

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

      {/*
       * Two columns once there is room for them. The measure stays at 68ch, so
       * the extra width buys a second column of content rather than longer
       * lines: the statement on the left, the facts it leaves out on the right.
       */}
      <div className="grid gap-8 2xl:grid-cols-[minmax(0,68ch)_minmax(0,1fr)] 2xl:gap-12">
        <div>
          <p className="max-w-[68ch] text-fg">
            {site.identity.year} in {site.identity.program} at {site.identity.education.school}, graduating{" "}
            {site.identity.graduation}. Looking for a{" "}
            {site.identity.seeking}.
          </p>

          <div
            className="rich-text mt-6 max-w-[68ch] leading-relaxed"
            // pi-lens-ignore: dangerously-set-inner-html
            dangerouslySetInnerHTML={{ __html: renderMarkdown(stripLeadingH1(page.body, page.title)) }}
          />
        </div>

        {/* Facts the statement above does not already make. */}
        <dl className="grid content-start gap-x-8 gap-y-4 text-sm sm:grid-cols-3 2xl:grid-cols-1 2xl:pt-1">
          <div>
            <dt className="font-medium text-fg">Based in</dt>
            <dd className="text-muted">{site.identity.location}</dd>
          </div>
          <div>
            <dt className="font-medium text-fg">Degree</dt>
            <dd className="text-muted">{site.identity.education.degree}</dd>
          </div>
          <div>
            <dt className="font-medium text-fg">Résumé</dt>
            <dd>
              <a href="/Nathan_Espejo_Resume.pdf" className="text-accent hover:text-fg">
                PDF
              </a>
            </dd>
          </div>
        </dl>
      </div>

      <h2 id="experience" className="section-label mt-16">
        Experience
      </h2>
      <ul className="mt-6 flex flex-col gap-6">
        {site.experience.map((experience) => {
          const href = caseStudyHref(experience.file);
          return (
            <li
              key={experience.org}
              // The border answers the pointer on every card; only the two with a
              // case study also fill, because the fill promises a click.
              className={`relative rounded-lg border border-rule bg-surface p-5 transition-colors hover:border-accent/40 ${
                href ? "hover:bg-accent/[0.06]" : ""
              }`}
            >
              <p className="text-muted">{experience.org}</p>
              <h3 className="mt-1 text-xl font-medium leading-snug text-fg">{experience.role}</h3>
              <p className="mt-1 text-sm text-muted">
                {experience.location} · {experience.dates}
              </p>
              {experience.homeLines?.length ? (
                /* No 68ch cap: these cards span the content column, and a
                   narrow column of bullets left a third of each card empty. */
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed marker:text-muted">
                  {experience.homeLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {href ? (
                <p className="mt-3">
                  {/* Stretched over the card, so the whole row opens the case
                      study and this stays the one link inside it. */}
                  <Link
                    href={href}
                    className="text-accent hover:text-fg after:absolute after:inset-0 after:content-['']"
                  >
                    Read the case study
                    <span aria-hidden="true"> →</span>
                  </Link>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <h2 id="projects" className="section-label mt-16">
        Projects
      </h2>

      {/*
       * The same cards /projects uses. The card already stretches its title
       * link over the whole box, and its thumbnails sit above that link so they
       * open the image viewer instead of following it.
       */}
      <ul className="mt-6 flex flex-col gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            id={project.rank === "lead" ? project.id : undefined}
          />
        ))}
      </ul>

      {/*
       * The rest of the index. A separator and a larger accent link make it
       * findable without dressing one link up as a button the rest of the page
       * does not use.
       */}
      <p className="mt-8 border-t border-rule pt-6 text-lg">
        <Link
          href={`/projects${REST_OF_PROJECTS}`}
          className="font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:text-fg hover:decoration-current"
        >
          and {site.projects.length - projects.length} more
          <span aria-hidden="true"> →</span>
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
