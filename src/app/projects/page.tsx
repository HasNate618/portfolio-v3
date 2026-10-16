import { PageShell } from "@/components/PageShell";
import { ProjectsView } from "@/components/views/ProjectsView";
import { getPage } from "@/lib/content";

export default function Page() {
  return (
    <PageShell current="/projects">
      <ProjectsView page={getPage("/projects")!} />
    </PageShell>
  );
}
