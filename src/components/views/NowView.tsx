import { site } from "@/data/site";
import { renderMarkdown } from "@/lib/markdown";
import type { Page } from "@/lib/content";

export function NowView({ page }: { page: Page }) {
  return (
    <article>
      <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">{page.title}</h1>

      <div
        className="rich-text mt-6 max-w-[68ch] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />

      <p className="mt-8 max-w-[68ch] leading-relaxed">
        Looking for a {site.identity.seeking}. If you are hiring, email me at{" "}
        <a href={`mailto:${site.contact.email}`} className="text-accent underline hover:text-fg">
          {site.contact.email}
        </a>
        .
      </p>
    </article>
  );
}
