import { PageShell } from "@/components/PageShell";
import { ExperienceView } from "@/components/views/ExperienceView";
import { getPage } from "@/lib/content";

export default function Page() {
  return (
    <PageShell current="/experience">
      <ExperienceView page={getPage("/experience")!} />
    </PageShell>
  );
}
