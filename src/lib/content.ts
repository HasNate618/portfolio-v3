import fs from "node:fs";
import path from "node:path";

/**
 * Authored prose lives in content/ as markdown. A file with a `route:` key is a
 * page; a file without one is corpus-only (chat + /knowledgebase) and never
 * rendered as a route.
 *
 * Nothing here reads `private/` — the loader only ever walks content/, so
 * private notes cannot leak into the build or the bot surface.
 */

export type Page = {
  /** Path relative to content/ with .md stripped, e.g. "projects/campus". */
  slug: string;
  route: string;
  title: string;
  description: string;
  priority: "start-here" | "reference";
  projectId?: string;
  experienceOrg?: string;
  /** Résumé only. The four-group layout is a documented exception to one-source. */
  skills?: { group: string; items: string[] }[];
  onThisPage: string[];
  body: string;
};

/** Left-hand nav order. Routes not listed here sort after these, alphabetically. */
export const NAV_ORDER = ["/projects", "/experience", "/now", "/resume"] as const;

const CONTENT_ROOT = "content";

type FrontmatterValue = string | string[] | Record<string, unknown>[];
type Frontmatter = Record<string, FrontmatterValue>;

function unquote(value: string): string {
  return value.replace(/^["']|["']$/g, "").trim();
}

/**
 * Flat scalars, one inline array shape (`key: [a, b, c]`), and one block list
 * (`key:` then `- group: X` / `  items: [a, b]`). Deliberately not a YAML parser:
 * the content is ours, and a dependency here would be the only thing standing
 * between a typo and a silently empty page.
 */
function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  if (!raw.startsWith("---")) return { data: {}, body: raw };

  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };

  const head = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\s*\n/, "");
  const data: Frontmatter = {};

  const lines = head.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[i].trim());
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.trim();

    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map(unquote)
        .filter(Boolean);
      continue;
    }

    if (value === "") {
      // A block list. Indented lines belong to it; the first unindented key ends it.
      const entries: Record<string, unknown>[] = [];
      let current: Record<string, unknown> | undefined;

      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
        const nested = lines[i + 1].trim();
        i += 1;

        const group = /^-\s*group:\s*(.+)$/.exec(nested);
        if (group) {
          current = { group: unquote(group[1]) };
          entries.push(current);
          continue;
        }

        const items = /^items:\s*\[(.*)\]$/.exec(nested);
        if (items && current) {
          current.items = items[1]
            .split(",")
            .map(unquote)
            .filter(Boolean);
        }
      }

      data[key] = entries;
      continue;
    }

    data[key] = unquote(value);
  }

  return { data, body };
}

function asString(value: FrontmatterValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: FrontmatterValue | undefined): string | undefined {
  const str = asString(value);
  return str.length > 0 ? str : undefined;
}

function asStringArray(value: FrontmatterValue | undefined): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function asSkills(value: FrontmatterValue | undefined): { group: string; items: string[] }[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      group: typeof entry.group === "string" ? entry.group : "",
      items: Array.isArray(entry.items) ? entry.items.map(String) : [],
    }))
    .filter((entry) => entry.group.length > 0 && entry.items.length > 0);
}

/** Body only, frontmatter removed. Used by the corpus projection. */
export function stripFrontmatter(raw: string): string {
  return parseFrontmatter(raw).body;
}

/** Every .md path under root, relative to root, forward-slashed and sorted. */
function walk(root: string): string[] {
  const out: string[] = [];

  function visit(dir: string, prefix: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(full, path.posix.join(prefix, entry.name));
      } else if (entry.name.endsWith(".md")) {
        out.push(path.posix.join(prefix, entry.name));
      }
    }
  }

  visit(root, "");
  return out.sort();
}

/** Paths relative to content/, including files that are not routes. */
export function listCorpusFilesFrom(root: string): string[] {
  return walk(root);
}

/** Parse every route file under root. Files without a `route:` key are skipped. */
export function loadFrom(root: string): Page[] {
  const pages: Page[] = [];

  for (const rel of walk(root)) {
    const raw = fs.readFileSync(path.join(root, rel), "utf-8");
    const { data, body } = parseFrontmatter(raw);

    const route = asOptionalString(data.route);
    if (!route) continue;

    pages.push({
      slug: rel.replace(/\.md$/, ""),
      route,
      title: asString(data.title),
      description: asString(data.description),
      priority: data.priority === "start-here" ? "start-here" : "reference",
      projectId: asOptionalString(data.projectId),
      experienceOrg: asOptionalString(data.experienceOrg),
      skills: asSkills(data.skills),
      onThisPage: asStringArray(data.onThisPage),
      body,
    });
  }

  return pages;
}

/** All route files, in nav order. */
export function listPages(): Page[] {
  const rank = (route: string): number => {
    if (route === "/") return -1;
    const i = (NAV_ORDER as readonly string[]).indexOf(route);
    return i === -1 ? NAV_ORDER.length : i;
  };

  return loadFrom(CONTENT_ROOT).sort((a, b) => {
    const diff = rank(a.route) - rank(b.route);
    return diff !== 0 ? diff : a.route.localeCompare(b.route);
  });
}

export function getPage(route: string): Page | undefined {
  return listPages().find((p) => p.route === route);
}

/** Every content/**\/*.md path relative to content/. */
export function listCorpusFiles(): string[] {
  return listCorpusFilesFrom(CONTENT_ROOT);
}
