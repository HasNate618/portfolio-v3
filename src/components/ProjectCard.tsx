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
          ? "border-accent/50 bg-accent/[0.03] hover:border-accent"
          : "border-rule bg-surface hover:border-accent/40"
      } ${first && (award ? "hover:bg-accent/[0.08]" : "hover:bg-accent/[0.06]")}`}
    >
      <div className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_27.5rem] 2xl:items-start 2xl:gap-8">
        <div className="min-w-0">
          <h3 className="text-xl font-medium leading-snug text-fg">{title}</h3>
          <div className="mt-1">
            <ProjectMetaRow projectId={project.id} />
          </div>
          <AwardBadge projectName={project.name} />
          <p className="mt-2 max-w-[68ch] leading-relaxed">{project.covers}</p>
          <div className="mt-3">
            <StackList projectId={project.id} />
          </div>
          <div className="mt-3">
            <LinkRow projectId={project.id} />
          </div>
        </div>
        {/* Wide enough for two columns, the text reads on the left and the
            project's images take the right, instead of trailing under it with
            the rest of the card left empty. */}
        <ProjectMedia media={project.media} variant="lead" className="mt-3 2xl:mt-0 max-lg:hidden" />
      </div>
    </li>
  );
}
