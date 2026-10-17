import fs from "node:fs";
import path from "node:path";
import { site, type Experience, type Project } from "@/data/site";
import { listCorpusFilesFrom, publicFrontmatter, stripFrontmatter } from "@/lib/content";
import { resolveStats } from "@/lib/markdown";

/**
 * The projection that makes "one source per fact" true.
 *
 * Pages render dates, role, status, links, stats and stack from components. The
 * chat corpus and the /knowledgebase/*.md bot surface cannot run components, so
 * without this the served document would quietly lose every fact the page shows
 * and the bot would answer from a thinner text than the reader sees.
 *
 * Frontmatter is stripped and stat placeholders are resolved here, so a served
 * document never opens with a YAML block and never leaks `{{stat:…}}`.
 */

const CONTENT_ROOT = "content";

export type CorpusDoc = { path: string; text: string };

function projectFacts(p: Project): string[] {
  const lines = [`Dates: ${p.dates}`, `Role: ${p.displayRole}`];
  // Carried into the corpus so the flagship is retrievable: the word appears in
  // the navigation docs, and without this line the specific doc could not match
  // "what is his flagship project?" at all.
  if (p.rank === "flagship") lines.push("Rank: flagship project");
  if (p.rank === "featured") lines.push("Rank: featured project");
  if (p.displayStatus) lines.push(`Status: ${p.displayStatus}`);
  if (p.event) lines.push(`Event: ${p.event}`);
  if (p.stack.length > 0) lines.push(`Stack: ${p.stack.join(" · ")}`);
  for (const stat of p.stats) lines.push(`${stat.label}: ${stat.value}`);
  if (p.links.length > 0) {
    lines.push(`Links: ${p.links.map((l) => `${l.label} ${l.href}`).join(" · ")}`);
  }
  // The card text the projects page shows. Without it the facts block is a list
  // of scalars, and a broad question ("his strongest projects") has almost
  // nothing in it to match on, so the doc never reaches the model.
  if (p.covers) lines.push(`Summary: ${p.covers}`);
  return lines;
}

function experienceFacts(e: Experience): string[] {
  const lines = [`Dates: ${e.dates}`, `Role: ${e.role}`, `Location: ${e.location}`];
  for (const stat of e.stats ?? []) lines.push(`${stat.label}: ${stat.value}`);
  // Same reason as a project's card text: a role that is only a date, a title
  // and a stat is hard to retrieve and easy to paraphrase badly.
  if (e.summary) lines.push(`Summary: ${e.summary}`);
  return lines;
}

/** Match a content path to its structured facts via the `file` link in site.ts. */
function factsFor(rel: string): string[] {
  const url = `/knowledgebase/${rel}`;

  const project = site.projects.find((p) => p.file === url);
  if (project) return projectFacts(project);

  const experience = site.experience.find((e) => e.file === url);
  if (experience) return experienceFacts(experience);

  return [];
}

function rewriteRelativeLinks(markdown: string, fromDir: string): string {
  // Relative .md links break for a crawler that lands mid-tree; point them at
  // absolute /knowledgebase/ URLs so the map stays traversable.
  return markdown.replace(
    /\]\((?!https?:\/\/|\/|#)([^)\s]+\.md)(#[^)\s]*)?\)/g,
    (_match, target: string, hash: string | undefined) => {
      const resolved = path.posix.normalize(path.posix.join(fromDir, target));
      return `](/knowledgebase/${resolved}${hash ?? ""})`;
    }
  );
}

function projectDoc(root: string, rel: string): CorpusDoc {
  const raw = fs.readFileSync(path.join(root, rel), "utf-8");
  const frontmatter = publicFrontmatter(raw);
  const body = stripFrontmatter(raw);
  const withStats = resolveStats(body);
  const withLinks = rewriteRelativeLinks(withStats, path.posix.dirname(rel));

  const facts = factsFor(rel);
  const projectedBody = facts.length > 0 ? `${facts.join("\n")}\n\n${withLinks}` : withLinks;
  const text = frontmatter ? `${frontmatter}\n${projectedBody}` : projectedBody;

  return { path: rel, text };
}

export function getCorpusDocsFrom(root: string): CorpusDoc[] {
  return listCorpusFilesFrom(root).map((rel) => projectDoc(root, rel));
}

export function getCorpusDocs(): CorpusDoc[] {
  return getCorpusDocsFrom(CONTENT_ROOT);
}

/**
 * Exact-string lookup, deliberately not normalized: normalizing would let
 * /knowledgebase/projects/../about.md resolve to an allowlisted document under
 * a non-canonical URL.
 */
/** First markdown heading in a projected doc. Used by /llms.txt, which has no titles of its own. */
export function corpusTitle(doc: CorpusDoc): string {
  const match = /^#\s+(.+)$/m.exec(doc.text);
  return match ? match[1].trim() : doc.path;
}

export function getCorpusDoc(rel: string): CorpusDoc | undefined {
  return getCorpusDocs().find((doc) => doc.path === rel);
}
