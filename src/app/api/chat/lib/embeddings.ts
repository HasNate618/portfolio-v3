import { createHash } from "node:crypto";
import fs from "fs";
import path from "path";
import { loadKnowledgebase } from "./chunks";
import { embedTexts, EMBED_MODEL, EMBED_DIMENSION } from "./cohere";

const CACHE_PATH = path.join(process.cwd(), "src", "app", "api", "chat", "lib", "embeddings-cache.json");

interface EmbeddingDoc {
  text: string;
  source: string;
  section: string;
  embedding: number[];
}

interface EmbeddingCache {
  contentHash: string;
  docs: EmbeddingDoc[];
}

let cachedEmbeddings: EmbeddingDoc[] | null = null;

/**
 * A hash of the chunks that were embedded, not a file mtime. Git does not preserve
 * mtimes, so a clone or CI checkout makes every file equally new and an mtime
 * comparison becomes a coin flip. The hash is stable across machines.
 */
export function corpusContentHash(chunks: { text: string; source: string; section?: string }[]): string {
  const hash = createHash("sha256");

  hash.update("section-chunks-v2");
  hash.update("\0");

  // The embedder identity is part of the cache key. Swapping the model changes
  // what every vector means, so a hash over the text alone would happily serve
  // an index built by a different model.
  hash.update(`${EMBED_MODEL}:${EMBED_DIMENSION}`);
  hash.update("\0");

  for (const chunk of chunks) {
    hash.update(chunk.source);
    hash.update("\0");
    if (chunk.section) {
      hash.update(chunk.section);
      hash.update("\0");
    }
    hash.update(chunk.text);
    hash.update("\0");
  }
  return hash.digest("hex");
}

/** The hash recorded in the cache, or null when there is no usable cache. */
export function readCacheHash(): string | null {
  if (!fs.existsSync(CACHE_PATH)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as Partial<EmbeddingCache>;
    return typeof parsed.contentHash === "string" ? parsed.contentHash : null;
  } catch {
    return null;
  }
}

export async function buildEmbeddings() {
  const chunks = loadKnowledgebase();

  console.log(`Building embeddings for ${chunks.length} chunks with ${EMBED_MODEL}...`);

  const batchSize = 96;
  const embeddings: EmbeddingDoc[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchEmbeddings = await embedTexts(
      batch.map((c) => c.text),
      "search_document"
    );

    for (let j = 0; j < batch.length; j++) {
      embeddings.push({
        text: batch[j].text,
        source: batch[j].source,
        section: batch[j].section,
        embedding: batchEmbeddings[j],
      });
    }

    console.log(`  Processed ${Math.min(i + batchSize, chunks.length)} / ${chunks.length}`);
  }

  const cache: EmbeddingCache = { contentHash: corpusContentHash(chunks), docs: embeddings };
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
  console.log(`Embeddings saved to ${CACHE_PATH} (hash ${cache.contentHash.slice(0, 12)})`);

  return embeddings;
}

export function loadEmbeddings(): EmbeddingDoc[] | null {
  if (cachedEmbeddings) return cachedEmbeddings;
  if (!fs.existsSync(CACHE_PATH)) return null;

  const parsed = (() => {
    try {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as EmbeddingCache | EmbeddingDoc[];
    } catch (error) {
      // A corrupt cache must not crash a request with a SyntaxError.
      console.error("embeddings-cache.json is unreadable — run npm run build-embeddings", error);
      return null;
    }
  })();
  if (parsed === null) return null;

  // A bare array is the pre-hash format. It cannot be checked for staleness, and it
  // predates the corpus projection, so serving it would answer from the wrong text.
  if (Array.isArray(parsed)) {
    console.warn("embeddings-cache.json predates the content hash — run npm run build-embeddings");
    return null;
  }

  cachedEmbeddings = parsed.docs;
  console.log(`Loaded ${cachedEmbeddings.length} cached embeddings`);
  return cachedEmbeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  // A zero vector has no direction. Returning NaN here would poison every
  // comparison downstream, and a NaN score silently loses to -Infinity.
  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
