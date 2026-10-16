import { loadEmbeddings, cosineSimilarity } from "./embeddings";
import { getCohereClient, embedTexts } from "./cohere";

interface ScoredChunk {
  text: string;
  source: string;
  embedding: number[];
  score: number;
}

interface RerankedChunk {
  text: string;
  source: string;
  score: number;
}

export async function retrieveRelevantChunks(query: string, topK = 20): Promise<ScoredChunk[]> {
  const embeddings = loadEmbeddings();
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings loaded. Run build-embeddings script first.");
  }

  const queryVectors = await embedTexts([query], "search_query");
  const queryVector = queryVectors[0];

  const scored = embeddings.map((doc) => ({
    ...doc,
    score: cosineSimilarity(queryVector, doc.embedding),
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

  return response.results.map((r) => ({
    text: chunks[r.index]?.text ?? "",
    source: chunks[r.index]?.source ?? "",
    score: r.relevanceScore,
  }));
}
