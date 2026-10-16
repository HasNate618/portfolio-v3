import Link from "next/link";
import { renderMarkdown } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { ExperienceMetaRow } from "@/components/ExperienceMetaRow";
import { StackList } from "@/components/StackList";
import { LinkRow } from "@/components/LinkRow";
import { OnThisPage } from "@/components/OnThisPage";
import { ProjectMedia } from "@/components/ProjectMedia";
import { AwardBadge } from "@/components/AwardBadge";
import { getProject } from "@/data/site";

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
        {page.experienceOrg ? (
          <ExperienceMetaRow org={page.experienceOrg} />
        ) : page.projectId ? (
          <ProjectMetaRow projectId={page.projectId} />
        ) : null}
      </div>

      {page.projectId ? (
        <div className="mt-4">
          <LinkRow projectId={page.projectId} />
        </div>
      ) : null}

      {page.projectId ? <AwardBadge projectName={getProject(page.projectId)?.name ?? ""} /> : null}

      <ProjectMedia media={getProject(page.projectId ?? "")?.media} className="mt-8 max-w-2xl" />

      <div className="mt-8">
        <OnThisPage items={page.onThisPage} />
      </div>

      <div
        className="rich-text mt-10 max-w-[68ch] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />

      {page.projectId || page.experienceOrg ? (
        <section className="mt-16">
          <h2 id="stack" className="section-label">
            Stack
          </h2>
          <div className="mt-4">
            <StackList projectId={page.projectId} org={page.experienceOrg} />
          </div>
        </section>
      ) : null}

      {nextHref && nextLabel ? (
        <p className="mt-16 border-t border-rule pt-6 text-sm">
          <Link href={nextHref} className="text-accent underline hover:text-fg">
            Next case study: {nextLabel} <span aria-hidden="true">→</span>
          </Link>
        </p>
      ) : null}
    </article>
  );
}
