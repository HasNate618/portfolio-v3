import Link from "next/link";
import { site, featuredProjects, leadProject } from "@/data/site";
import { renderMarkdown, stripLeadingH1 } from "@/lib/markdown";
import { getPage, type Page } from "@/lib/content";
import { CompactProjectCard } from "@/components/CompactProjectCard";

/**
 * The home page carries the whole story: who he is, the newest roles, then the
 * projects worth leading with. The projects reuse the cards from /projects
 * rather than a second, thinner design: the card already stretches its title
 * over the whole box, keeps its images on top of that link so they still open
 * the viewer, and lists every outward link first.
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
        // pi-lens-ignore: dangerously-set-inner-html
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
                  <span className="font-medium text-fg">{experience.homeRole ?? experience.role}</span>
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
       * The same cards /projects uses. The card already stretches its title
       * link over the whole box, and its thumbnails sit above that link so they
       * open the image viewer instead of following it.
       */}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <CompactProjectCard
            key={project.id}
            project={project}
            variant="home"
            id={project.rank === "lead" ? project.id : undefined}
          />
        ))}
      </ul>

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
