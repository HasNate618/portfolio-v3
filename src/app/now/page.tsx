import { PageShell } from "@/components/PageShell";
import { NowView } from "@/components/views/NowView";
import { getPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata(getPage("/now")!);
}

export default function Page() {
  return (
    <PageShell current="/now">
      <NowView page={getPage("/now")!} />
    </PageShell>
  );
}
