import MarkdownIt from "markdown-it";
import { getProject } from "@/data/site";

/**
 * Content files never restate a figure that site.ts owns. They write
 * `{{stat:campus.chunks}}` and this resolves it, so a page and the bot surface
 * cannot drift apart on the next edit.
 */
const STAT_PATTERN = /\{\{stat:([a-zA-Z0-9-]+)\.([a-zA-Z0-9_-]+)\}\}/g;

/** Substitute stat placeholders and return plain text. Used by the corpus projection. */
export function resolveStats(text: string): string {
  return text.replace(STAT_PATTERN, (_match, projectId: string, key: string) => {
    const project = getProject(projectId);
    const stat = project?.stats.find((s) => s.key === key);

    if (!stat) {
      // Loud on purpose: a silently blank figure is the failure mode this
      // whole placeholder mechanism exists to prevent.
      throw new Error(`unknown stat: ${projectId}.${key}`);
    }

    return stat.value;
  });
}

/** Heading text to anchor id. Shared with the "on this page" list so they always agree. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

// Give every heading a stable id so "on this page" links resolve.
md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const inline = tokens[idx + 1];
  if (inline && inline.type === "inline") {
    tokens[idx].attrSet("id", slugify(inline.content));
  }
  return self.renderToken(tokens, idx, options);
};

/**
 * A fence whose info string is `diagram` becomes an accessible figure: the ASCII
 * is hidden from assistive tech and the leading `alt:` line becomes the caption.
 * Diagrams live in content files, so the pipeline owns this rather than a
 * component. A diagram without an alt line throws, for the same reason an
 * unknown stat throws: a silent accessibility gap is the failure mode.
 */
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token.info.trim();

  if (!info.startsWith("diagram")) {
    const lang = info.split(/\s+/)[0];
    const cls = lang ? ` class="language-${md.utils.escapeHtml(lang)}"` : "";
    return `<pre><code${cls}>${md.utils.escapeHtml(token.content)}</code></pre>\n`;
  }

  const lines = token.content.replace(/\n$/, "").split("\n");
  const alt = lines[0]?.startsWith("alt: ") ? lines.shift()!.slice("alt: ".length).trim() : "";

  if (!alt) throw new Error("diagram fence is missing its `alt: ` line");

  return [
    "<figure class=\"my-6\">",
    `<pre aria-hidden="true" class="overflow-x-auto rounded border border-rule bg-black/30 p-4 text-xs leading-relaxed text-fg">${md.utils.escapeHtml(lines.join("\n"))}</pre>`,
    `<figcaption class="sr-only">${md.utils.escapeHtml(alt)}</figcaption>`,
    "</figure>\n",
  ].join("");
};

export function renderMarkdown(source: string, opts: { ids?: boolean } = {}): string {
  const html = md.render(resolveStats(source));
  return opts.ids === false ? html.replace(/ id="[^"]*"/g, "") : html;
}
