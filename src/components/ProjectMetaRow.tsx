import { getProject } from "@/data/site";

/**
 * Dates, event, role and status come from site.ts, never from props — a page
 * cannot restate them. The literal "present" in site.ts is rendered as "now"
 * here; that mapping lives in exactly one place.
 */
export function ProjectMetaRow({ projectId }: { projectId: string }) {
  const project = getProject(projectId);
  if (!project) return null;

  const dates = project.dates.replace(/\bpresent\b/gi, "now");

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
      <span>{dates}</span>
      {project.event ? (
        <>
          <Sep />
          <span>{project.event}</span>
        </>
      ) : null}
      <Sep />
      <span>{project.displayRole}</span>
      {project.displayStatus ? (
        <>
          <Sep />
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {project.displayStatus}
          </span>
        </>
      ) : null}
    </p>
  );
}

function Sep() {
  return <span aria-hidden="true">·</span>;
}
