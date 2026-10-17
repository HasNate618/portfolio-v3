import "@/styles/print.css";
import { PageShell } from "@/components/PageShell";
import { ResumeView } from "@/components/views/ResumeView";
import { getPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata(getPage("/resume")!);
}

export default function Page() {
  return (
    <PageShell current="/resume">
      <ResumeView page={getPage("/resume")!} />
    </PageShell>
  );
}
