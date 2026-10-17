import { PageShell } from "@/components/PageShell";
import { ChatView } from "@/components/views/ChatView";
import { getPage } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export function generateMetadata() {
  return pageMetadata(getPage("/chat")!);
}

export default function Page() {
  return (
    <PageShell current="/chat">
      <ChatView page={getPage("/chat")!} />
    </PageShell>
  );
}
