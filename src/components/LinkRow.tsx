import { getProject } from "@/data/site";

export function LinkRow({ projectId }: { projectId: string }) {
  const project = getProject(projectId);
  if (!project || project.links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-4">
      {project.links.map((link) => (
        <li key={link.href}>
          <a href={link.href} className="font-medium text-accent hover:text-fg">
            {link.label} <span aria-hidden="true">→</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
