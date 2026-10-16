import { getExperience, getProject } from "@/data/site";
import { modelTableHtml } from "@/lib/tables";
import { MARKDOWN_OPTIONS } from "@/lib/markdown-options";

/** The id may be a project id or an experience org ("3D Western"), so dots are the only delimiter. */
const STAT_PATTERN = /\{\{stat:([^.}]+)\.([a-zA-Z0-9_-]+)\}\}/g;

/** Substitute stat placeholders and return plain text. Used by the corpus projection. */
export function resolveStats(text: string): string {
  return text.replace(STAT_PATTERN, (_match, id: string, key: string) => {
    // Projects first, then roles: the 3D Western dataset figure belongs to an
    // experience entry, and a role has no project id.
    const stat =
      getProject(id)?.stats.find((s) => s.key === key) ??
      getExperience(id)?.stats?.find((s) => s.key === key);

    if (!stat) {
      // Loud on purpose: a silently blank figure is the failure mode this
      // whole placeholder mechanism exists to prevent.
      throw new Error(`unknown stat: ${id}.${key}`);
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

type AnyMd = { render: (str: string) => string; utils: { escapeHtml: (s: string) => string }; renderer: { rules: Record<string, unknown> } };

let cachedMd: AnyMd | null = null;

/**
 * Lazy, so `markdown-it` is required at first use (runtime) instead of imported
 * at module load. Static imports of markdown-it pull it into the route bundle and
 * a broken vendor chunk (`./vendor-chunks/markdown-it.js`) made `next start`
 * return 500 on every page. Lazy require also honours `serverExternalPackages`.
 */
export function getMd(): AnyMd {
  if (cachedMd) return cachedMd;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MarkdownIt = require("markdown-it");
  const Ctor = typeof MarkdownIt === "function" ? MarkdownIt : MarkdownIt.default;

  const instance = new Ctor(MARKDOWN_OPTIONS) as AnyMd;

  // Give every heading a stable id so "on this page" links resolve.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance.renderer.rules.heading_open = (tokens: any, idx: number, options: any, _env: unknown, self: any) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instance.renderer.rules.fence = (tokens: any, idx: number) => {
    const token = tokens[idx];
    const [kind, arg] = token.info.trim().split(/\s+/);
    const lines = token.content.replace(/\n$/, "").split("\n");

    // escape via the instance's own utils
    const esc = (s: string) => instance.utils.escapeHtml(s);

    if (kind === "diagram") {
      const alt = lines[0]?.startsWith("alt: ") ? lines.shift()!.slice("alt: ".length).trim() : "";
      if (!alt) throw new Error("diagram fence is missing its `alt: ` line");

      return [
        '<figure class="my-6">',
        `<pre aria-hidden="true" class="overflow-x-auto rounded border border-rule bg-black/30 p-4 text-xs leading-relaxed text-fg">${esc(lines.join("\n"))}</pre>`,
        `<figcaption class="sr-only">${esc(alt)}</figcaption>`,
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

    const cls = kind ? ` class="language-${esc(kind)}"` : "";
    return `<pre><code${cls}>${esc(token.content)}</code></pre>\n`;
  };

  cachedMd = instance;
  return instance;
}

export function renderMarkdown(source: string, opts: { ids?: boolean } = {}): string {
  const html = getMd().render(resolveStats(source));
  return opts.ids === false ? html.replace(/ id="[^"]*"/g, "") : html;
}
