import Link from "next/link";
import { awardFor, type Project } from "@/data/site";
import { projectLinks } from "@/lib/project-links";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { LinkRow } from "@/components/LinkRow";
import { ProjectMedia } from "@/components/ProjectMedia";

/** The card's one line: `cardLine` where set, otherwise the first sentence of `covers`. */
export function cardLineFor(project: Project): string {
  const [first] = (project.cardLine ?? project.covers).split(". ");
  return first.endsWith(".") ? first : `${first}.`;
}

/**
 * A short card for a grid: one thumbnail, the name, the meta row (which keeps
 * the solo or team label), one line and the links. No stack chips: the full
 * card with its stack lives on /projects for the case studies, and the chat
 * corpus carries every stack.
 *
 * Both variants list every link, case study first. `variant="home"` shows the
 * one line; `variant="grid"` shows the full `covers` text, which is already
 * one or two sentences for these projects.
 */
export function CompactProjectCard({
  project,
  id,
  variant,
}: {
  project: Project;
  id?: string;
  variant: "home" | "grid";
}) {
  const first = projectLinks(project.id)[0];
  const award = awardFor(project.name);

  const title = first ? (
    first.internal ? (
      <Link href={first.href} className="hover:text-accent after:absolute after:inset-0 after:content-['']">
        {project.name}
      </Link>
    ) : (
      <a
        href={first.href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-accent after:absolute after:inset-0 after:content-['']"
      >
        {project.name}
      </a>
    )
  ) : (
    project.name
  );

  return (
    <li
      id={id}
      className={`relative flex flex-col rounded-lg border p-5 transition-colors ${
        award
          ? "border-accent/50 bg-accent/5 hover:border-accent"
          : "border-rule bg-surface hover:border-accent/40"
      }`}
    >
      {/* On /projects the grid hides its images on phones to keep the page short;
          they and their expanded views are there from the sm breakpoint up. Home keeps
          them, and gives the picture the width of the card rather than a thumbnail. */}
      <ProjectMedia
        media={project.media}
        variant="card"
        large={variant === "home"}
        className={variant === "grid" ? "mb-3 max-sm:hidden" : "mb-3"}
      />
      <h3 className="font-medium leading-snug text-fg">{title}</h3>
      <div className="mt-1">
        <ProjectMetaRow projectId={project.id} />
      </div>
      {award ? <p className="mt-1 text-xs font-bold text-accent">{award.prize}</p> : null}
      <p className="mt-2 text-sm leading-relaxed">
        {variant === "home" ? cardLineFor(project) : project.covers}
      </p>
      <div className="mt-auto pt-3 text-sm">
        <LinkRow projectId={project.id} />
      </div>
    </li>
  );
}
