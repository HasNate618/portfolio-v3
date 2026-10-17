import { featuredProjects, flagshipProject, site } from "@/data/site";
import { factsBlockFor } from "@/lib/corpus";

/**
 * Coverage floor.
 *
 * A broad question embeds closer to the pages that enumerate projects than to
 * any single project: for "What are Nathan's strongest projects?" the Campus
 * facts chunk ranked 53rd of 208, so retrieval never passed it to the reranker,
 * and the answer invented TeraGo and 3D Western detail out of nothing. A reranker
 * cannot be talked into ranking a document it was never handed.
 *
 * So when the reranked chunks hold no project and no role, the facts blocks of
 * the work the home page leads with are appended: the flagship, the featured
 * projects and the roles. It costs roughly 900 tokens, and only on the questions
 * where retrieval came back with nothing specific.
 */

export interface PromptChunk {
  text: string;
  source: string;
}

/**
 * A question that names a project or a role is specific: it keeps the context
 * retrieval chose for it, and the pin stays out of the way.
 */
function questionNamesSubject(question: string): boolean {
  const names = [
    ...site.projects.flatMap((project) => [project.name, project.id.replace(/-/g, " ")]),
    ...site.experience.flatMap((role) => [role.org, role.id.replace(/-/g, " ")]),
  ];

  return names.some((name) =>
    new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(question),
  );
}

function relative(file: string | undefined): string | null {
  const prefix = "/knowledgebase/";
  return file?.startsWith(prefix) ? file.slice(prefix.length) : null;
}

/**
 * The work the home page leads with: the flagship, the featured projects, and the
 * roles that are on the resume. This is what a broad question should have in view.
 */
function leadingDocs(): string[] {
  const files = [
    flagshipProject()?.file,
    ...featuredProjects().map((project) => project.file),
    ...site.experience.filter((role) => role.onResume).map((role) => role.file),
  ];

  return [...new Set(files.map(relative).filter((rel): rel is string => rel !== null))];
}

/** The documents a broad question should always have in view. */
export function pinnedChunks(): PromptChunk[] {
  const chunks: PromptChunk[] = [];

  for (const source of leadingDocs()) {
    const text = factsBlockFor(source);
    if (text) chunks.push({ source, text });
  }
  return chunks;
}

export function withCoverageFloor(chunks: PromptChunk[], question = ""): PromptChunk[] {
  if (questionNamesSubject(question)) return chunks;

  const present = new Set(chunks.map((chunk) => chunk.source));
  const pinned = pinnedChunks();

  /*
   * Coverage means one of these documents is already in the context. Counted any
   * other way it fails: projects/cyberdeck.md is a project doc too, and counting
   * it is why the floor did not fire for "What is the most impressive thing
   * Nathan has built?", the question the conflation was written from.
   */
  if (pinned.some((chunk) => present.has(chunk.source))) return chunks;

  return [...chunks, ...pinned.filter((chunk) => !present.has(chunk.source))];
}
