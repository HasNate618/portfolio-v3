import { PageShell } from "@/components/PageShell";
import { HomeView } from "@/components/views/HomeView";
import { getPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata(getPage("/")!, { home: true });
}

export default function Page() {
  return (
    <PageShell current="/">
      <HomeView page={getPage("/")!} />
    </PageShell>
  );
}
