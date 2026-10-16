import { getProject } from "@/data/site";

export function StatRow({ projectId }: { projectId: string }) {
  const project = getProject(projectId);
  if (!project || project.stats.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      {project.stats.map((stat) => (
        <div key={stat.key}>
          <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
            {stat.label}
          </dt>
          <dd className="mt-1 text-3xl font-bold tracking-tight text-fg">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
