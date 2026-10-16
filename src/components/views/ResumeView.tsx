import { site } from "@/data/site";
import { renderMarkdown } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ExperienceMetaRow } from "@/components/ExperienceMetaRow";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { StackList } from "@/components/StackList";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthYear(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** A `## Group` section, split into its `### Name` subsections in site.ts order. */
function subsections(body: string, group: string): string[] {
  const part = body.split(/^## /m).find((chunk) => chunk.split("\n")[0].trim() === group);
  if (!part) return [];
  return part
    .split(/^### /m)
    .slice(1)
    .map((chunk) => chunk.slice(chunk.indexOf("\n") + 1).trim());
}

function Body({ source }: { source: string }) {
  if (!source) return null;
  return (
    <div
      className="rich-text mt-3 max-w-[68ch] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
    />
  );
}

export function ResumeView({ page }: { page: Page }) {
  const education = site.identity.education;
  const roleBodies = subsections(page.body, "Experience");
  const projectBodies = subsections(page.body, "Projects");

  const roles = site.experience.filter((role) => role.onResume);
  const projects = site.projects.filter((project) => project.onResume);
  const skills = page.skills ?? [];

  const contactLinks = site.contact.links.filter((link) =>
    ["Portfolio", "GitHub", "LinkedIn"].includes(link.label)
  );

  return (
    <article>
      <p>
        <a
          href="/Nathan_Espejo_Resume.pdf"
          className="inline-block rounded-lg border border-rule px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
        >
          Download PDF
        </a>
      </p>

      <h1 className="mt-6 text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>

      <p className="mt-4 flex flex-wrap gap-x-2 text-sm text-muted">
        <a href={`mailto:${site.contact.email}`} className="hover:text-accent">
          {site.contact.email}
        </a>
        {contactLinks.map((link) => (
          <span key={link.href}>
            <span aria-hidden="true">·</span>{" "}
            <a href={link.href} className="hover:text-accent">
              {link.href.replace(/^https?:\/\//, "")}
            </a>
          </span>
        ))}
      </p>

      <section className="mt-10">
        <h2 id="education" className="section-label">
          Education
        </h2>
        <p className="mt-3 max-w-[68ch] leading-relaxed">
          <span className="font-medium text-fg">
            {education.school} · {education.location}
          </span>
          <br />
          {education.degree}, {education.honors} · {monthYear(education.start)} to{" "}
          {monthYear(education.end)}
        </p>
      </section>

      <section className="mt-10">
        <h2 id="experience" className="section-label">
          Experience
        </h2>
        {roles.map((role, index) => (
          <div key={role.org} className="mt-6">
            <h3 className="font-medium text-fg">
              {role.role} · {role.org}
            </h3>
            <div className="mt-1">
              <ExperienceMetaRow org={role.org} />
            </div>
            <Body source={roleBodies[index] ?? ""} />
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 id="projects" className="section-label">
          Projects
        </h2>
        {projects.map((project, index) => (
          <div key={project.id} className="mt-6">
            <h3 className="font-medium text-fg">{project.name}</h3>
            <div className="mt-1">
              <ProjectMetaRow projectId={project.id} />
            </div>
            <div className="mt-2">
              <StackList projectId={project.id} />
            </div>
            <Body source={projectBodies[index] ?? ""} />
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 id="hackathon-awards" className="section-label">
          Hackathon Awards
        </h2>
        <p className="mt-3 max-w-[68ch] leading-relaxed">
          {site.hackathons.awards} awards across {site.hackathons.entered} hackathons.
        </p>
        <ul className="mt-3 flex max-w-[68ch] list-disc flex-col gap-1 pl-5 leading-relaxed">
          {site.awards.map((award) => (
            <li key={`${award.event}-${award.year}`}>
              {award.prize} · {award.event} ({award.project})
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 id="technical-skills" className="section-label">
          Technical Skills
        </h2>
        {skills.map((group) => (
          <p key={group.group} className="mt-3 max-w-[68ch] leading-relaxed">
            <span className="font-medium text-fg">{group.group}:</span> {group.items.join(", ")}
          </p>
        ))}
      </section>
    </article>
  );
}
