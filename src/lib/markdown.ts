import { getExperience, getProject } from "@/data/site";
import { modelTableHtml } from "@/lib/tables";
import { MARKDOWN_OPTIONS } from "@/lib/markdown-options";
import { diagramHtml } from "@/lib/diagrams";

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

/**
 * Drop a leading H1 when the page template already renders that same title.
 * The heading stays in the file so the knowledge base and the chat still have it.
 */
export function stripLeadingH1(body: string, title: string): string {
  const match = /^#\s+([^\n]+)\n*/.exec(body);
  if (!match) return body;
  const heading = match[1].trim().replace(/^["']|["']$/g, "");
  if (heading !== title.trim()) return body;
  return body.slice(match[0].length);
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
   *   `figure`   - an image under public/, from required `src:`, `alt:` and
   *                `caption:` lines, plus optional `width:`/`height:` so the
   *                page does not shift while the image loads
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

      // `diagram <name>` draws the registered flow from src/lib/diagrams.ts.
      // A bare `diagram` fence still renders its text art.
      if (arg) {
        return ['<figure class="my-6">', diagramHtml(arg), `<figcaption class="sr-only">${esc(alt)}</figcaption>`, "</figure>\n"].join("");
      }

      return [
        '<figure class="my-6">',
        `<pre aria-hidden="true" class="overflow-x-auto rounded border border-rule bg-black/30 p-4 text-xs leading-relaxed text-fg">${esc(lines.join("\n"))}</pre>`,
        `<figcaption class="sr-only">${esc(alt)}</figcaption>`,
        "</figure>\n",
      ].join("");
    }

    if (kind === "figure") {
      const fields: Record<string, string> = {};
      for (const line of lines) {
        const match = /^([a-z]+):\s*(.*)$/.exec(line);
        if (match) fields[match[1]] = match[2].trim();
      }
      for (const key of ["src", "alt", "caption"]) {
        if (!fields[key]) throw new Error(`figure fence is missing its \`${key}: \` line`);
      }
      // Site-local paths only. A single leading slash also rules out "//host/x",
      // so a content file can neither hotlink nor smuggle in a scheme.
      if (!/^\/[^/]/.test(fields.src)) {
        throw new Error("figure fence `src:` must be a site path under public/, like /projects/x.webp");
      }
      const sized = /^\d+$/.test(fields.width ?? "") && /^\d+$/.test(fields.height ?? "");
      const size = sized ? ` width="${fields.width}" height="${fields.height}"` : "";

      /*
       * Clicking a figure expands it with the same CSS `:target` lightbox the
       * project thumbnails use (ProjectMedia builds the markup; LightboxKeys
       * adds Escape and focus). The fence emits that markup rather than a React
       * component because a fence returns a string, the way `diagram` and
       * `models` do.
       *
       * The two ids are a contract with LightboxKeys, which derives the
       * thumbnail as `${overlay.id}-thumb`: the overlay id must end in the
       * thumbnail's id, or Escape and focus restoration have nowhere to go.
       */
      const overlayId = `figure-${slugify(fields.src)}`;
      const thumbId = `${overlayId}-thumb`;
      const fullSize = `
        <a href="${esc(fields.src)}" target="_blank" rel="noopener noreferrer" class="font-medium text-accent hover:text-fg">Open the full-size file</a>`;

      return [
        '<figure class="my-8">',
        `<a id="${thumbId}" href="#${overlayId}" class="block cursor-zoom-in">`,
        `<img src="${esc(fields.src)}" alt="${esc(fields.alt)}"${size} loading="lazy" decoding="async" class="h-auto w-full rounded-lg border border-rule bg-white transition-colors hover:border-accent" />`,
        "</a>",
        `<figcaption class="mt-2 text-sm text-muted">${esc(fields.caption)}</figcaption>`,
        "</figure>",
        `<div id="${overlayId}" class="lightbox" tabindex="-1">`,
        `<a href="#${thumbId}" class="lightbox-backdrop" aria-label="Close the expanded image"></a>`,
        '<figure class="lightbox-frame">',
        `<img src="${esc(fields.src)}" alt="${esc(fields.alt)}"${size} decoding="async" class="max-h-[80vh] max-w-[92vw] rounded-lg border border-rule bg-white" />`,
        `<figcaption class="mt-3 max-w-[60ch] text-center text-sm text-muted">${esc(fields.caption)}${fullSize}</figcaption>`,
        "</figure>",
        "</div>\n",
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
