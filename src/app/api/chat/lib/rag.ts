import { loadEmbeddings, cosineSimilarity } from "./embeddings";
import { getCohereClient, embedTexts } from "./cohere";

export interface ScoredChunk {
  text: string;
  source: string;
  section: string;
  embedding: number[];
  score: number;
}

export interface RerankedChunk {
  text: string;
  source: string;
  section: string;
  score: number;
}

/**
 * The index maps exist to point at other docs, and they name every project and
 * role. That makes them match almost any query, so they crowd out the specific
 * doc that actually answers it — "what did you build at TeraGo?" was returning
 * the experience index above terago.md itself. They stay in the index as a
 * fallback but lose to a specific doc.
 */
const NAVIGATION_DOC = /^(index|projects\/index|experience\/index|projects\/other|chat)\.md$/;
const NAVIGATION_PENALTY = 0.5;

/** Exported so the demotion rule can be tested without hitting the rerank API. */
export function isNavigationDoc(source: string): boolean {
  return NAVIGATION_DOC.test(source);
}

/**
 * The chat path sends detail docs only. Search keeps the whole index, because a
 * visitor searching "projects" should find projects/index.md.
 */
export function detailPool<T extends { source: string }>(chunks: T[]): T[] {
  return chunks.filter((chunk) => !isNavigationDoc(chunk.source));
}

export type RetrieveOptions = { excludeNav?: boolean; topK?: number };

export async function retrieveRelevantChunks(
  query: string,
  options: RetrieveOptions | number = {},
): Promise<ScoredChunk[]> {
  // The number form is the search route's call; it keeps the whole index.
  const { excludeNav = false, topK = 20 } =
    typeof options === "number" ? { topK: options } : options;

  const embeddings = loadEmbeddings();
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings loaded. Run build-embeddings script first.");
  }

  const [queryEmbedding] = await embedTexts([query], "search_query");

  const pool = excludeNav ? detailPool(embeddings) : embeddings;
  const scored = pool.map((doc) => ({
    ...doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

export async function rerankChunks(
  query: string,
  chunks: ScoredChunk[],
  topN = 10
): Promise<RerankedChunk[]> {
  const cohere = getCohereClient();

  const response = await cohere.rerank({
    query,
    documents: chunks.map((c) => c.text),
    model: "rerank-english-v3.0",
    topN,
  });

  return response.results
    .map((r) => {
      const source = chunks[r.index]?.source ?? "";
      return {
        text: chunks[r.index]?.text ?? "",
        source,
        section: chunks[r.index]?.section ?? "",
        score: isNavigationDoc(source) ? r.relevanceScore * NAVIGATION_PENALTY : r.relevanceScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** Below this the reranker is guessing, and that chunk crowds out a better one. */
const MIN_SCORE = 0.1;
/** A top score under this means the question was broad, not that the corpus is thin. */
const BROAD_TOP_SCORE = 0.3;
const MAX_CHUNKS = 6;
const MAX_BROAD_CHUNKS = 2;

/**
 * The reranker returns scores on its own scale, so a fixed top-k sends six chunks for
 * a question that three of them would have answered. A broad question gets two.
 * Input is expected sorted by score, which is what `rerankChunks` returns.
 */
export function applyScoreFloor(chunks: RerankedChunk[]): RerankedChunk[] {
  const above = chunks.filter((chunk) => chunk.score >= MIN_SCORE);
  if (above.length === 0) return [];
  const cap = above[0].score < BROAD_TOP_SCORE ? MAX_BROAD_CHUNKS : MAX_CHUNKS;
  return above.slice(0, cap);
}
