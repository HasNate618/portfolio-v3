import "@/styles/print.css";
import { PageShell } from "@/components/PageShell";
import { ResumeView } from "@/components/views/ResumeView";
import { getPage } from "@/lib/content";

export default function Page() {
  return (
    <PageShell current="/resume">
      <ResumeView page={getPage("/resume")!} />
    </PageShell>
  );
}
