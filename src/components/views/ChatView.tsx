import { site } from "@/data/site";
import { renderMarkdown } from "@/lib/markdown";
import type { Page } from "@/lib/content";
import { ChatPanel } from "@/app/chat/ChatPanel";

/**
 * Server-rendered shell: the intro, the disclaimer and the starters are in the
 * HTML, so the page reads with JavaScript off. Only ChatPanel is client-side.
 */
export function ChatView({ page }: { page: Page }) {
  const starters = page.starters ?? [];

  return (
    <article>
      <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>

      <div
        className="rich-text mt-6 max-w-[68ch] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />

      <p className="mt-4 max-w-[68ch] leading-relaxed text-muted">
        Answers come from my public notes and can be wrong. Check the pages, or email{" "}
        <a
          href={`mailto:${site.contact.email}`}
          className="text-accent underline hover:text-fg"
        >
          {site.contact.email}
        </a>
        .
      </p>

      <noscript>
        <p className="mt-6 max-w-[68ch] leading-relaxed">
          The chat needs JavaScript. Everything it knows is on the projects, experience and resume
          pages, and in plain text at{" "}
          <a href="/llms.txt" className="text-accent underline">
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

      <ChatPanel starters={starters} />
    </article>
  );
}
