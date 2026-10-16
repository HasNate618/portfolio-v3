import { awardFor } from "@/data/site";

/**
 * Marks a project that won something. The award is looked up from `site.awards`
 * rather than duplicated onto the project, so this badge and the awards table on
 * /projects cannot drift apart.
 */
export function AwardBadge({ projectName }: { projectName: string }) {
  const award = awardFor(projectName);
  if (!award) return null;

  return (
    <p className="mt-2 text-xs">
      <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
        {award.prize}
      </span>{" "}
      <span className="text-muted">
        {award.event} {award.year}
      </span>
    </p>
  );
}
