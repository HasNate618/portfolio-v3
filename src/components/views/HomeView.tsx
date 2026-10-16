import Link from "next/link";
import { site, highlightProjects, getProject } from "@/data/site";
import { renderMarkdown } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { StatRow } from "@/components/StatRow";
import { StackList } from "@/components/StackList";
import { LinkRow } from "@/components/LinkRow";

export function HomeView({ page }: { page: Page }) {
  const campus = getProject("campus")!;
  const featured = highlightProjects().filter((p) => p.id !== "campus");

  return (
    <article>
      <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>

      <div
        className="mt-6 max-w-[68ch] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />

      <p className="mt-6 max-w-[68ch] text-muted">
        {site.identity.year} at {site.identity.education.school}. Looking for a{" "}
        {site.identity.seeking}.
      </p>

      <ul className="mt-6 flex flex-wrap gap-3">
        <li>
          <a
            href={`mailto:${site.contact.email}`}
            className="inline-block rounded border border-rule px-4 py-2 text-sm font-medium text-fg hover:border-accent hover:text-accent"
          >
            Email me
          </a>
        </li>
        {site.contact.links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="inline-block rounded border border-rule px-4 py-2 text-sm font-medium text-fg hover:border-accent hover:text-accent"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Campus: the strongest proof, above the fold, with checkable numbers. */}
      <section aria-labelledby="campus" className="mt-12 rounded border border-rule p-6">
        <h2 id="campus" className="text-2xl font-semibold text-fg">
          {campus.name}
        </h2>
        <div className="mt-2">
          <ProjectMetaRow projectId="campus" />
        </div>
        <p className="mt-4 max-w-[68ch] leading-relaxed">{campus.covers}</p>
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

      <h2 id="featured" className="mt-16 text-xs font-bold uppercase tracking-widest text-fg">
        Featured
      </h2>
      <ul className="mt-6 flex flex-col gap-8">
        {featured.map((project) => (
          <li key={project.id}>
            <h3 className="text-lg font-medium leading-snug text-fg">
              <Link href={`/projects/${project.id}`} className="hover:text-accent">
                {project.name}
              </Link>
            </h3>
            <div className="mt-1">
              <ProjectMetaRow projectId={project.id} />
            </div>
            <p className="mt-2 max-w-[68ch] leading-relaxed">{project.covers}</p>
          </li>
        ))}
      </ul>

      <h2 id="experience" className="mt-16 text-xs font-bold uppercase tracking-widest text-fg">
        Experience
      </h2>
      <ul className="mt-6 flex flex-col gap-4">
        {site.experience.map((experience) => (
          <li key={experience.org} className="sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
            <span className="text-xs uppercase tracking-wide text-muted">{experience.dates}</span>
            <span className="mt-1 sm:mt-0">
              <span className="font-medium text-fg">{experience.role}</span>
              <span className="text-muted"> · {experience.org}</span>
            </span>
          </li>
        ))}
      </ul>

      <h2 id="ask" className="mt-16 text-xs font-bold uppercase tracking-widest text-fg">
        Ask
      </h2>
      <p className="mt-6 max-w-[68ch] leading-relaxed">
        Questions about my projects or experience? The chat answers from my public notes. It can be
        wrong, so trust the pages first.
      </p>
      <p className="mt-4">
        <Link href="/chat" className="text-accent underline hover:text-fg">
          Open chat <span aria-hidden="true">→</span>
        </Link>
      </p>
    </article>
  );
}
