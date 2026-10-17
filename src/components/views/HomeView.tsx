import Link from "next/link";
import { site, featuredProjects, flagshipProject, awardFor } from "@/data/site";
import { renderMarkdown, stripLeadingH1 } from "@/lib/markdown";
import { caseStudyHref as projectHref, getPage, type Page } from "@/lib/content";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { StatRow } from "@/components/StatRow";
import { StackList } from "@/components/StackList";
import { LinkRow } from "@/components/LinkRow";
import { ProjectMedia } from "@/components/ProjectMedia";
import { AwardBadge } from "@/components/AwardBadge";
import { AwardsTable } from "@/components/AwardsTable";

/**
 * The home page carries the whole story: who he is, the newest roles, then the
 * projects worth leading with.
 *
 * The ids on these sections are still load-bearing: the page's own "on this
 * page" list and any in-page link resolve against them, so renaming one breaks
 * a link. The header nav no longer points here — it goes to /experience and
 * /projects — so these are anchors, not navigation.
 *
 * Experience is deliberately partial here: the newest roles, then a button to
 * the full record. Five roles with their summaries pushed the projects — the
 * actual proof — far down the page.
 */
const HOME_ROLES = 2;
const HOME_AWARDS = ["Careerly", "Auralis", "Eyecandy", "CareBridge"];

export function HomeView({ page }: { page: Page }) {
  const campus = flagshipProject()!;
  const featured = featuredProjects();

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
        {site.identity.year} at {site.identity.education.school}. Looking for a{" "}
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
            <li key={experience.org} className="sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
              <span className="text-xs uppercase tracking-wide text-muted">{experience.dates}</span>
              <div className="mt-1 sm:mt-0">
                <p>
                  <span className="font-medium text-fg">{experience.role}</span>
                  <span className="text-muted"> · {experience.org}</span>
                  <span className="text-muted"> · {experience.location}</span>
                </p>
                {experience.summary ? (
                  <p className="mt-1 max-w-[68ch] leading-relaxed">{experience.summary}</p>
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
      <div className="mt-10 flex items-center gap-4">
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
        <Link
          href="/experience"
          className="inline-block rounded-full border border-rule px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
        >
          Show all experience <span aria-hidden="true">→</span>
        </Link>
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      </div>

      <h2 id="projects" className="section-label mt-16">
        Projects
      </h2>

      {/* Campus: the strongest proof, with checkable numbers. */}
      <section aria-labelledby="campus" className="mt-6 rounded-lg border border-rule bg-surface p-6">
        <h3 id="campus" className="text-2xl font-semibold text-fg">
          {campus.name}
        </h3>
        <div className="mt-2">
          <ProjectMetaRow projectId="campus" />
        </div>
        <p className="mt-4 max-w-[68ch] leading-relaxed">{campus.covers}</p>
        <ProjectMedia media={campus.media} className="mt-5 max-w-xl" />
        <div className="mt-6">
          <StatRow projectId="campus" home />
        </div>
        <div className="mt-6">
          <StackList projectId="campus" />
        </div>
        <div className="mt-6">
          <LinkRow projectId="campus" />
        </div>
      </section>

      <ul className="mt-8 flex flex-col gap-6">
        {featured.map((project) => {
          const award = awardFor(project.name);
          // Same honesty rule as the roles above: a featured project only links
          // out when a case-study route exists, so no card points at a 404.
          const href = projectHref(project);
          return (
            <li
              key={project.id}
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
              <ProjectMedia media={project.media} className="mt-3" />
              <div className="mt-3">
                <StatRow projectId={project.id} home />
              </div>
              <div className="mt-3">
                <StackList projectId={project.id} />
              </div>
              <div className="mt-3">
                <LinkRow projectId={project.id} />
              </div>
            </li>
          );
        })}
      </ul>

      {/* The way to the full index, centred between hairlines. */}
      <div className="mt-10 flex items-center gap-4">
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
        <Link
          href="/projects"
          className="inline-block rounded-full border border-rule px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
        >
          All projects <span aria-hidden="true">→</span>
        </Link>
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      </div>

      {/*
       * Awards close the page: the hackathon record first, then the Dean's
       * Honour List years, which come from the education entry rather than a
       * second list so the two can never disagree.
       */}
      <h2 id="awards" className="section-label mt-16">
        Awards
      </h2>
      <p className="mt-4 max-w-[68ch] leading-relaxed">
        {site.hackathons.awards} awards across {site.hackathons.entered} hackathons, all with teams.
        Four I&apos;d point to are below. The rest are on the projects page.
      </p>
      <div className="mt-6">
        <AwardsTable awards={site.awards.filter((award) => HOME_AWARDS.includes(award.project))} />
      </div>
      <p className="mt-6 max-w-[68ch] leading-relaxed">
        Off the hackathon circuit: {site.identity.education.honors} at{" "}
        {site.identity.education.school}.
      </p>
    </article>
  );
}
