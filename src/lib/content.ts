import fs from "node:fs";
import path from "node:path";
import { site } from "@/data/site";

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
  /** page | project | experience | index | awards | skills */
  type: string;
  /** Project or experience id. Matches site.ts. */
  id?: string;
  dates?: string;
  role?: string;
  status?: string;
  updated?: string;
  priority: "start-here" | "reference";
  /** Résumé only. The four-group layout is a documented exception to one-source. */
  skills?: { group: string; items: string[] }[];
  /** Chat only: the empty-state starter questions. */
  starters?: string[];
  onThisPage: string[];
  body: string;
};

/** Keys that belong to a rendered page and are stripped from the published knowledge base. */
export const PAGE_ONLY_KEYS = ["route", "onThisPage", "starters", "skills", "priority"] as const;

export type DocMeta = {
  title: string;
  type: string;
  id?: string;
  description?: string;
  dates?: string;
  role?: string;
  status?: string;
  updated?: string;
};

/**
 * Nav order for anything that lists routes. `/now` is deliberately absent: the
 * page still exists and is still in the sitemap, but it left the left-hand nav,
 * so nothing here should imply it is a stop on the tour.
 */
export const NAV_ORDER = ["/experience", "/projects", "/resume"] as const;

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

function docMeta(data: Frontmatter): DocMeta {
  return {
    title: asString(data.title),
    type: asString(data.type),
    id: asOptionalString(data.id) ?? asOptionalString(data.projectId),
    description: asOptionalString(data.description),
    dates: asOptionalString(data.dates),
    role: asOptionalString(data.role),
    status: asOptionalString(data.status),
    updated: asOptionalString(data.updated),
  };
}

/** Frontmatter the chunker and the sitemap read. Page-only keys are not included. */
export function readDocMeta(raw: string): DocMeta {
  return docMeta(parseFrontmatter(raw).data);
}

/**
 * Frontmatter published at /knowledgebase. Route furniture is omitted, while
 * title, type, id, dates, role, status, rank, tags, related and updated remain.
 */
export function publicFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return "";
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return "";

  const pageOnly = new Set<string>(PAGE_ONLY_KEYS);
  const lines = raw.slice(3, end).trim().split("\n");
  const kept: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = /^([A-Za-z0-9_-]+):/.exec(lines[index]);
    if (!match || !pageOnly.has(match[1])) {
      kept.push(lines[index]);
      continue;
    }

    // Block values such as the resume's skills consume their indented lines.
    while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) index += 1;
  }

  return `---\n${kept.join("\n")}\n---`;
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

    const meta = docMeta(data);
    pages.push({
      slug: rel.replace(/\.md$/, ""),
      route,
      title: meta.title,
      description: asString(data.description),
      type: meta.type,
      id: meta.id,
      dates: meta.dates,
      role: meta.role,
      status: meta.status,
      updated: meta.updated,
      priority: data.priority === "start-here" ? "start-here" : "reference",
      skills: asSkills(data.skills),
      starters: asStringArray(data.starters),
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

/**
 * The route to a project's case study, or null when there isn't one.
 * `project.file` is a knowledgebase path — most documented projects have one
 * for the chat corpus, but a page only exists when a content file declares
 * the route, so the route table is the only honest check.
 */
export function caseStudyHref(project: { id: string }): string | null {
  // TeraGo's case study is experience data and lives under /experience.
  const route = project.id === "terago" ? "/experience/terago" : `/projects/${project.id}`;
  return getPage(route) ? route : null;
}

/** Every content/**\/*.md path relative to content/. */
export function listCorpusFiles(): string[] {
  return listCorpusFilesFrom(CONTENT_ROOT);
}

/** Updated dates for sitemap lastmod. Missing dates fall back at the call site. */
export function listCorpusUpdated(root = CONTENT_ROOT): { path: string; updated?: string }[] {
  return walk(root).map((rel) => {
    const raw = fs.readFileSync(path.join(root, rel), "utf-8");
    return { path: rel, updated: readDocMeta(raw).updated };
  });
}

const DOC_TYPES = new Set(["page", "project", "experience", "index", "awards", "skills"]);

/**
 * Required frontmatter and a real H1. Route files and corpus files share this
 * gate so a chat document cannot drift away from the schema.
 */
export function contentProblems(root: string): string[] {
  const problems: string[] = [];

  for (const rel of walk(root)) {
    const raw = fs.readFileSync(path.join(root, rel), "utf-8");
    const { data, body } = parseFrontmatter(raw);
    const meta = docMeta(data);
    const where = `${root}/${rel}`;

    if (!meta.title) problems.push(`${where}: missing title`);
    if (!DOC_TYPES.has(meta.type)) problems.push(`${where}: missing or invalid type`);
    if (!meta.description) problems.push(`${where}: missing description`);
    else if (meta.description.length > 155) {
      problems.push(`${where}: description is ${meta.description.length} characters (max 155)`);
    }
    if (!meta.updated || !/^\d{4}-\d{2}-\d{2}$/.test(meta.updated)) {
      problems.push(`${where}: missing updated date (YYYY-MM-DD)`);
    }
    if (meta.type === "project" || meta.type === "experience") {
      if (!meta.id) problems.push(`${where}: missing id`);
      if (!meta.dates) problems.push(`${where}: missing dates`);
    }
    if (meta.type === "project" && meta.id && !site.projects.some((project) => project.id === meta.id)) {
      problems.push(`${where}: id ${meta.id} is not a project in site.ts`);
    }
    if (meta.type === "experience" && meta.id && !site.experience.some((role) => role.id === meta.id)) {
      problems.push(`${where}: id ${meta.id} is not an experience entry in site.ts`);
    }
    if (data.projectId || data.experienceOrg) {
      problems.push(`${where}: rename projectId/experienceOrg to id`);
    }
    const h1 = /^#\s+(.+)$/m.exec(body)?.[1].trim();
    if (!h1) problems.push(`${where}: missing H1`);
    else if (h1 !== meta.title) problems.push(`${where}: H1 does not match title`);
  }

  return problems;
}
