import { PageShell } from "@/components/PageShell";
import { ExperienceView } from "@/components/views/ExperienceView";
import { getPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata(getPage("/experience")!);
}

export default function Page() {
  return (
    <PageShell current="/experience">
      <ExperienceView page={getPage("/experience")!} />
    </PageShell>
  );
}
