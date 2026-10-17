import Link from "next/link";
import { getProject, getExperience } from "@/data/site";
import { caseStudyHref } from "@/lib/content";

/**
 * Tech pills for a project or a role. Both are accepted because TeraGo is an
 * experience (an internship, not a project) and still has a stack worth showing.
 *
 * `limit` caps what a card shows. The featured projects carry twelve to nineteen
 * pills, which buries the card's own text and makes every card look the same
 * size; a card is a summary, and the case study is where the full stack belongs.
 * The overflow is a count that links to the study when one exists.
 */
export function StackList({
  projectId,
  org,
  limit,
}: {
  projectId?: string;
  org?: string;
  limit?: number;
}) {
  const project = projectId ? getProject(projectId) : undefined;
  const stack = project ? project.stack : org ? getExperience(org)?.stack : undefined;

  if (!stack?.length) return null;

  const shown = limit ? stack.slice(0, limit) : stack;
  const hidden = stack.length - shown.length;
  const href = project ? caseStudyHref(project) : null;

  return (
    <ul className="flex flex-wrap gap-2">
      {shown.map((item) => (
        <li
          key={item}
          className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
        >
          {item}
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          {href ? (
            <Link
              href={href}
              className="rounded-full border border-rule px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              +{hidden} more
            </Link>
          ) : (
            <span className="rounded-full border border-rule px-3 py-1 text-xs font-medium text-muted">
              +{hidden} more
            </span>
          )}
        </li>
      ) : null}
    </ul>
  );
}
