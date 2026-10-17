import { PageShell } from "@/components/PageShell";
import { ProjectsView } from "@/components/views/ProjectsView";
import { getPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata(getPage("/projects")!);
}

export default function Page() {
  return (
    <PageShell current="/projects">
      <ProjectsView page={getPage("/projects")!} />
    </PageShell>
  );
}
