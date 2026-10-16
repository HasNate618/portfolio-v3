import { CohereClient } from "cohere-ai";
import fs from "fs";
import path from "path";
import { loadKnowledgebase } from "./chunks";

const CACHE_PATH = path.join(process.cwd(), "src", "app", "api", "chat", "lib", "embeddings-cache.json");

interface EmbeddingDoc {
  text: string;
  source: string;
  embedding: number[];
}

let cachedEmbeddings: EmbeddingDoc[] | null = null;

export async function buildEmbeddings() {
  const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
  const chunks = loadKnowledgebase();

  console.log(`Building embeddings for ${chunks.length} chunks...`);

  const batchSize = 96;
  const embeddings: EmbeddingDoc[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await cohere.embed({
      texts: batch.map((c) => c.text),
      model: "embed-english-v3.0",
      inputType: "search_document",
    });

    const batchEmbeddings = response.embeddings as number[][];

    for (let j = 0; j < batch.length; j++) {
      embeddings.push({
        text: batch[j].text,
        source: batch[j].source,
        embedding: batchEmbeddings[j],
      });
    }

    console.log(`  Processed ${Math.min(i + batchSize, chunks.length)} / ${chunks.length}`);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(embeddings));
  console.log(`Embeddings saved to ${CACHE_PATH}`);
  return embeddings;
}

export function loadEmbeddings(): EmbeddingDoc[] | null {
  if (cachedEmbeddings) return cachedEmbeddings;

  if (fs.existsSync(CACHE_PATH)) {
    const data = fs.readFileSync(CACHE_PATH, "utf-8");
    cachedEmbeddings = JSON.parse(data) as EmbeddingDoc[];
    console.log(`Loaded ${cachedEmbeddings.length} cached embeddings`);
    return cachedEmbeddings;
  }

  return null;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
