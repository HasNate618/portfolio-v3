import { featuredProjects, flagshipProject, site } from "@/data/site";
import { factsBlockFor } from "@/lib/corpus";
import { isNavigationDoc } from "./rag";

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

const SUBSTANTIVE_DOC = /^(?:projects|experience)\//;

/** An index page lists projects; it does not say what any of them does. */
function isCoverage(chunk: PromptChunk): boolean {
  return SUBSTANTIVE_DOC.test(chunk.source) && !isNavigationDoc(chunk.source);
}

function relative(file: string | undefined): string | null {
  const prefix = "/knowledgebase/";
  return file?.startsWith(prefix) ? file.slice(prefix.length) : null;
}

/** The documents a broad question should always have in view. */
export function pinnedChunks(): PromptChunk[] {
  const files = [
    flagshipProject()?.file,
    ...featuredProjects().map((project) => project.file),
    ...site.experience.map((role) => role.file),
  ];

  const chunks: PromptChunk[] = [];
  for (const source of new Set(files.map(relative).filter((rel): rel is string => rel !== null))) {
    const text = factsBlockFor(source);
    if (text) chunks.push({ source, text });
  }
  return chunks;
}

export function withCoverageFloor(chunks: PromptChunk[]): PromptChunk[] {
  if (chunks.some(isCoverage)) return chunks;

  const present = new Set(chunks.map((chunk) => chunk.source));
  return [...chunks, ...pinnedChunks().filter((chunk) => !present.has(chunk.source))];
}
