import Link from "next/link";
import { renderMarkdown, stripLeadingH1 } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { ExperienceMetaRow } from "@/components/ExperienceMetaRow";
import { StackList } from "@/components/StackList";
import { LinkRow } from "@/components/LinkRow";
import { ProjectMedia } from "@/components/ProjectMedia";
import { AwardBadge } from "@/components/AwardBadge";
import { getExperienceById, getProject } from "@/data/site";

/**
 * Back and next are props so TeraGo can point at /experience while the project
 * case studies point at /projects. The meta row is chosen by the page, which is
 * what lets /experience/terago show an experience row instead of a project row.
 */
export function CaseStudy({
  page,
  backHref,
  backLabel,
  nextHref,
  nextLabel,
}: {
  page: Page;
  backHref: string;
  backLabel: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  const project = page.id ? getProject(page.id) : undefined;
  const experience = page.id ? getExperienceById(page.id) : undefined;

  return (
    <article>
      <p className="text-sm">
        <Link href={backHref} className="text-muted hover:text-accent">
          <span aria-hidden="true">←</span> {backLabel}
        </Link>
      </p>

      <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>

      {page.description ? (
        <p className="mt-4 max-w-[68ch] text-lg leading-relaxed text-muted">{page.description}</p>
      ) : null}

      <div className="mt-4">
        {experience ? (
          <ExperienceMetaRow org={experience.org} />
        ) : project ? (
          <ProjectMetaRow projectId={project.id} />
        ) : null}
      </div>

      {project ? (
        <div className="mt-4">
          <LinkRow projectId={project.id} selfHref={page.route} />
        </div>
      ) : null}

      {project ? <AwardBadge projectName={project.name} /> : null}

      <ProjectMedia media={project?.media} className="mt-8 max-w-2xl" />

      {/* No "On this page" box: a case study is short enough to read
          straight through, and the box pushed the body below the fold. */}

      <div
        className="rich-text mt-10 max-w-[68ch] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(stripLeadingH1(page.body, page.title)) }}
      />

      {project || experience ? (
        <section className="mt-16">
          <h2 id="stack" className="section-label">
            Stack
          </h2>
          <div className="mt-4">
            <StackList projectId={project?.id} org={experience?.org} />
          </div>
        </section>
      ) : null}

      {nextHref && nextLabel ? (
        <p className="mt-16 border-t border-rule pt-6 text-sm">
          <Link href={nextHref} className="text-accent hover:text-fg">
            Next case study: {nextLabel} <span aria-hidden="true">→</span>
          </Link>
        </p>
      ) : null}
    </article>
  );
}
