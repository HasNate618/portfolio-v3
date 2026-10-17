import Link from "next/link";
import { site } from "@/data/site";
import { renderMarkdown, slugify, stripLeadingH1 } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { getPage } from "@/lib/content";
import { ExperienceMetaRow } from "@/components/ExperienceMetaRow";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-08" to "Aug 2024". Education dates stay in site.ts rather than in prose. */
function monthYear(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/**
 * The content file holds one `## ` section per role, in site.ts order, so the
 * prose lives in content and the dates, titles and locations stay in one place.
 * A count mismatch is a test failure rather than a silently missing role.
 */
function sections(body: string): string[] {
  return body
    .split(/^## /m)
    .slice(1)
    .map((part) => part.slice(part.indexOf("\n") + 1).trim());
}

/**
 * The full record: every role with its prose, then education and the hackathon
 * count. The home page carries only the newest roles and links here, so this is
 * the page for someone who wants the whole list.
 */
export function ExperienceView({ page }: { page: Page }) {
  const body = stripLeadingH1(page.body, page.title);
  const intro = body.split(/^## /m)[0].trim();
  const roleBodies = sections(body);
  const education = site.identity.education;

  return (
    <article>
      <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>

      <div
        className="rich-text mt-6 max-w-[68ch] leading-relaxed"
        // pi-lens-ignore: dangerouslySetInnerHTML
        dangerouslySetInnerHTML={{ __html: renderMarkdown(intro) }}
      />

      {site.experience.map((role, index) => (
        <section key={role.org} className="mt-12">
          <h2 id={slugify(role.org)} className="text-xl font-semibold tracking-tight">
            {role.role} · {role.org}
          </h2>
          <div className="mt-1">
            <ExperienceMetaRow org={role.org} />
          </div>
          {roleBodies[index] ? (
            <div
              className="rich-text mt-4 max-w-[68ch] leading-relaxed"
              // pi-lens-ignore: dangerouslySetInnerHTML
              dangerouslySetInnerHTML={{ __html: renderMarkdown(roleBodies[index]) }}
            />
          ) : null}
          {/* Any role with its own route page gets a link; a role without one
              gets nothing rather than a dead end. */}
          {getPage(`/experience/${role.id}`) ? (
            <p className="mt-3 text-sm">
              <Link href={`/experience/${role.id}`} className="font-medium text-accent hover:text-fg">
                Case study <span aria-hidden="true">→</span>
              </Link>
            </p>
          ) : null}
        </section>
      ))}

      <section className="mt-12">
        <h2 id="education" className="text-xl font-semibold tracking-tight">
          Education
        </h2>
        <p className="mt-4 max-w-[68ch] leading-relaxed">
          {education.school} · {education.location}
          <br />
          {education.degree} · {monthYear(education.start)} to {monthYear(education.end)} (expected)
          <br />
          {education.honors}.
        </p>
      </section>

      <section className="mt-12">
        <h2 id="hackathons" className="text-xl font-semibold tracking-tight">
          Hackathons
        </h2>
        <p className="mt-4 max-w-[68ch] leading-relaxed">
          {site.hackathons.awards} awards across {site.hackathons.entered} hackathons.{" "}
          <Link href="/#awards" className="font-medium text-accent hover:text-fg">
            See the table <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>
    </article>
  );
}
