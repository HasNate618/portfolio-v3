import Link from "next/link";
import { awardFor, type Project } from "@/data/site";
import { projectLinks } from "@/lib/project-links";
import { ProjectMetaRow } from "@/components/ProjectMetaRow";
import { StackList } from "@/components/StackList";
import { LinkRow } from "@/components/LinkRow";
import { ProjectMedia } from "@/components/ProjectMedia";
import { AwardBadge } from "@/components/AwardBadge";

/**
 * A project card whose whole surface follows the first link in its own list.
 * The title link is stretched over the card with a pseudo-element, so the
 * card is still one semantic link without JavaScript; the media and link row
 * sit above that overlay and keep their own targets.
 */
export function ProjectCard({ project, id }: { project: Project; id?: string }) {
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
      className={`relative rounded-lg border p-6 transition-colors ${
        award
          ? "border-accent/50 bg-accent/5 hover:border-accent"
          : "border-rule bg-surface hover:border-accent/40"
      }`}
    >
      <h3 className="text-lg font-medium leading-snug text-fg">{title}</h3>
      <div className="mt-1">
        <ProjectMetaRow projectId={project.id} />
      </div>
      <AwardBadge projectName={project.name} />
      <p className="mt-2 max-w-[68ch] leading-relaxed">{project.covers}</p>
      <ProjectMedia media={project.media} className="mt-3" />
      <div className="mt-3">
        <StackList projectId={project.id} />
      </div>
      <div className="mt-3">
        <LinkRow projectId={project.id} />
      </div>
    </li>
  );
}
