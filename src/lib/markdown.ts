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

export function renderMarkdown(source: string, opts: { ids?: boolean } = {}): string {
  const html = md.render(resolveStats(source));
  return opts.ids === false ? html.replace(/ id="[^"]*"/g, "") : html;
}
