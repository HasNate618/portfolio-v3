import { PageShell } from "@/components/PageShell";
import { HomeView } from "@/components/views/HomeView";
import { getPage } from "@/lib/content";

export default function Page() {
  return (
    <PageShell current="/">
      <HomeView page={getPage("/")!} />
    </PageShell>
  );
}
