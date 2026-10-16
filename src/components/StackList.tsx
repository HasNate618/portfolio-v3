import { getProject, getExperience } from "@/data/site";

/**
 * Tech pills for a project or a role. Both are accepted because TeraGo is an
 * experience (an internship, not a project) and still has a stack worth showing.
 */
export function StackList({ projectId, org }: { projectId?: string; org?: string }) {
  const stack = projectId
    ? getProject(projectId)?.stack
    : org
      ? getExperience(org)?.stack
      : undefined;

  if (!stack?.length) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {stack.map((item) => (
        <li
          key={item}
          className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
