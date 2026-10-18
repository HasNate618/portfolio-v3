import { loadEmbeddings, cosineSimilarity } from "./embeddings";
import { getCohereClient, embedTexts } from "./cohere";

interface ScoredChunk {
  text: string;
  source: string;
  section: string;
  embedding: number[];
  score: number;
}

interface RerankedChunk {
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
const NAVIGATION_DOC = /^(index|projects\/index|experience\/index|projects\/other)\.md$/;
const NAVIGATION_PENALTY = 0.5;

/** Exported so the demotion rule can be tested without hitting the rerank API. */
export function isNavigationDoc(source: string): boolean {
  return NAVIGATION_DOC.test(source);
}

export async function retrieveRelevantChunks(query: string, topK = 20): Promise<ScoredChunk[]> {
  const embeddings = loadEmbeddings();
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings loaded. Run build-embeddings script first.");
  }

  const [queryEmbedding] = await embedTexts([query], "search_query");

  const scored = embeddings.map((doc) => ({
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
