import Link from "next/link";
import { site, featuredProjects, flagshipProject, awardFor } from "@/data/site";
import { renderMarkdown } from "@/lib/markdown";
import { getPage, type Page } from "@/lib/content";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { StatRow } from "@/components/StatRow";
import { StackList } from "@/components/StackList";
import { LinkRow } from "@/components/LinkRow";
import { ProjectMedia } from "@/components/ProjectMedia";
import { AwardBadge } from "@/components/AwardBadge";
import { AwardsTable } from "@/components/AwardsTable";

/**
 * The home page carries the whole story: who he is, the roles, then the
 * projects worth leading with. The nav points at these sections rather than at
 * separate index pages, so `#experience` and `#projects` are load-bearing ids —
 * renaming either breaks the header links.
 */
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
      <h1 className="sr-only">{page.title}</h1>

      <div
        className="rich-text mt-6 max-w-[68ch] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />

      <p className="mt-6 max-w-[68ch] text-muted">
        {site.identity.year} at {site.identity.education.school}. Looking for a{" "}
        {site.identity.seeking}.
      </p>

      <h2 id="experience" className="section-label mt-16">
        Experience
      </h2>
      <ul className="mt-6 flex flex-col gap-4">
        {site.experience.map((experience) => {
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
                    <Link href={href} className="text-accent underline hover:text-fg">
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
          <StatRow projectId="campus" />
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
                <Link href={`/projects/${project.id}`} className="hover:text-accent">
                  {project.name}
                </Link>
              </h3>
              <div className="mt-1">
                <ProjectMetaRow projectId={project.id} />
              </div>
              <AwardBadge projectName={project.name} />
              <p className="mt-2 max-w-[68ch] leading-relaxed">{project.covers}</p>
              <ProjectMedia media={project.media} className="mt-3" />
              <div className="mt-3">
                <StackList projectId={project.id} />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6">
        <Link
          href="/projects"
          className="inline-block rounded-lg border border-rule px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
        >
          All projects <span aria-hidden="true">→</span>
        </Link>
      </p>

      <h2 id="ask" className="section-label mt-16">
        Ask
      </h2>
      <p className="mt-6 max-w-[68ch] leading-relaxed">
        Questions about my projects or experience? The chat answers from my public notes. It can be
        wrong, so trust the pages first.
      </p>
      <p className="mt-4">
        <Link href="/chat" className="text-accent hover:text-fg">
          Open chat <span aria-hidden="true">→</span>
        </Link>
      </p>

      {/*
       * Awards close the page: the hackathon record first, then the Dean's
       * Honour List years, which come from the education entry rather than a
       * second list so the two can never disagree.
       */}
      <h2 id="awards" className="section-label mt-16">
        Awards
      </h2>
      <p className="mt-4 max-w-[68ch] leading-relaxed">
        {site.hackathons.awards} awards across {site.hackathons.entered} hackathons. Most were team
        projects.
      </p>
      <div className="mt-6">
        <AwardsTable />
      </div>
      <p className="mt-6 max-w-[68ch] leading-relaxed">
        Off the hackathon circuit: {site.identity.education.honors} at{" "}
        {site.identity.education.school}.
      </p>
    </article>
  );
}
