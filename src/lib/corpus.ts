import fs from "node:fs";
import path from "node:path";
import { site, type Experience, type Project } from "@/data/site";
import { listCorpusFilesFrom, publicFrontmatter, stripFrontmatter } from "@/lib/content";
import { resolveStats } from "@/lib/markdown";
import { thirdPerson } from "@/lib/voice";

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
  // A denial the model can hedge is weaker than a statement it can repeat: the
  // chat kept borrowing the homelab's approval gate and rollback for Campus.
  if (p.limits) lines.push(`Limits: ${p.limits}`);
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

  // site.ts writes his summaries in the first person. The card and the corpus are
  // both read as claims about him, so the pronouns are turned around at both
  // boundaries, from one definition: voice.ts.
  const project = site.projects.find((p) => p.file === url);
  if (project) return projectFacts(project).map(thirdPerson);

  const experience = site.experience.find((e) => e.file === url);
  if (experience) return experienceFacts(experience).map(thirdPerson);

  return [];
}

/**
 * The same facts block the index serves, for a document retrieval did not reach.
 * The coverage floor pins these, so they must stay the projection rather than a
 * second, hand-written summary that could drift from the indexed one.
 */
export function factsBlockFor(rel: string): string | null {
  const facts = factsFor(rel);
  return facts.length > 0 ? facts.join("\n") : null;
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
