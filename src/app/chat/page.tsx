import { PageShell } from "@/components/PageShell";
import { ChatView } from "@/components/views/ChatView";
import { getPage } from "@/lib/content";

export default function Page() {
  return (
    <PageShell current="/chat">
      <ChatView page={getPage("/chat")!} />
    </PageShell>
  );
}
