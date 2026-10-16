import { getProject } from "@/data/site";

export function StackList({ projectId }: { projectId: string }) {
  const project = getProject(projectId);
  if (!project || project.stack.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {project.stack.map((item) => (
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
