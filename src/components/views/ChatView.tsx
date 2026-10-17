import { renderMarkdown, stripLeadingH1 } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ChatPanel } from "@/app/chat/ChatPanel";

/**
 * Server-rendered shell: the intro is rendered here and handed to the panel as
 * the assistant's opening message, so the copy stays in content/chat.md while
 * the transcript owns its presentation. The starters are in the HTML too, so the
 * page reads with JavaScript off. Only ChatPanel is client-side.
 *
 * The page is the chat and nothing else. No visible title above the panel and no
 * footnote below it: an earlier version pushed the panel down with a heading and
 * followed it with a disclaimer taking up the space the transcript wanted, on
 * the one page a visitor arrives at to type a question.
 */
export function ChatView({ page }: { page: Page }) {
  const starters = page.starters ?? [];

  return (
    <article>
      {/*
       * Kept for structure, not shown: a page with no heading leaves a screen
       * reader with nothing to navigate from, and content/chat.md still owns the
       * wording.
       */}
      <h1 className="sr-only">{page.title}</h1>

      <noscript>
        <p className="mt-6 max-w-[68ch] leading-relaxed">
          The chat needs JavaScript. Everything it knows is on the projects, experience and resume
          pages, and in plain text at{" "}
          <a href="/llms.txt" className="text-accent">
            /llms.txt
          </a>
          .
        </p>
        <p className="mt-6 text-sm text-muted">Try one:</p>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
          {starters.map((starter) => (
            <li key={starter}>{starter}</li>
          ))}
        </ul>
      </noscript>

      <ChatPanel starters={starters} introHtml={renderMarkdown(stripLeadingH1(page.body, page.title))} />
    </article>
  );
}
