import MarkdownIt from "markdown-it";
import { getProject } from "@/data/site";
import { modelTableHtml } from "@/lib/tables";

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
 * Fenced directives. A fence's info string selects a renderer:
 *   `diagram`  - accessible figure, with a required leading `alt:` line
 *   `models X` - the model table for project X, with a required `caption:` line
 *   anything else - an ordinary code block
 * Structured content stays in content files, and the pipeline owns the markup.
 */
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const [kind, arg] = token.info.trim().split(/\s+/);
  const lines = token.content.replace(/\n$/, "").split("\n");

  if (kind === "diagram") {
    const alt = lines[0]?.startsWith("alt: ") ? lines.shift()!.slice("alt: ".length).trim() : "";
    // Loud on purpose, like an unknown stat: a silent accessibility gap is the
    // failure mode this whole directive exists to prevent.
    if (!alt) throw new Error("diagram fence is missing its `alt: ` line");

    return [
      '<figure class="my-6">',
      `<pre aria-hidden="true" class="overflow-x-auto rounded border border-rule bg-black/30 p-4 text-xs leading-relaxed text-fg">${md.utils.escapeHtml(lines.join("\n"))}</pre>`,
      `<figcaption class="sr-only">${md.utils.escapeHtml(alt)}</figcaption>`,
      "</figure>\n",
    ].join("");
  }

  if (kind === "models") {
    const caption = lines[0]?.startsWith("caption: ")
      ? lines.shift()!.slice("caption: ".length).trim()
      : "";
    if (!caption) throw new Error("models fence is missing its `caption: ` line");

    const rows = getProject(arg ?? "")?.models ?? [];
    if (rows.length === 0) throw new Error(`models fence names a project with no models: ${arg}`);

    return `${modelTableHtml(rows, caption)}\n`;
  }

  const cls = kind ? ` class="language-${md.utils.escapeHtml(kind)}"` : "";
  return `<pre><code${cls}>${md.utils.escapeHtml(token.content)}</code></pre>\n`;
};

export function renderMarkdown(source: string, opts: { ids?: boolean } = {}): string {
  const html = md.render(resolveStats(source));
  return opts.ids === false ? html.replace(/ id="[^"]*"/g, "") : html;
}
