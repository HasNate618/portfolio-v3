import { getProject } from "@/data/site";

export function StatRow({ projectId }: { projectId: string }) {
  const project = getProject(projectId);
  if (!project || project.stats.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {project.stats.map((stat) => (
        <div key={stat.key}>
          <dt className="text-xs uppercase tracking-wide text-muted">{stat.label}</dt>
          <dd className="text-2xl font-semibold text-fg">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
