import { PageShell } from "@/components/PageShell";
import { NowView } from "@/components/views/NowView";
import { getPage } from "@/lib/content";

export default function Page() {
  return (
    <PageShell current="/now">
      <NowView page={getPage("/now")!} />
    </PageShell>
  );
}
