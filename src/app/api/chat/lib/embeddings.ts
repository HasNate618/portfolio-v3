import { createHash } from "node:crypto";
import fs from "fs";
import path from "path";
import { loadKnowledgebase } from "./chunks";
import { embedTexts, EMBED_MODEL, EMBED_DIMENSION } from "./cohere";
import { QUESTION_BANK } from "@/data/question-bank";

const CACHE_PATH = path.join(process.cwd(), "src", "app", "api", "chat", "lib", "embeddings-cache.json");
const BANK_CACHE_PATH = path.join(process.cwd(), "src", "data", "question-bank-cache.json");

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

interface BankEmbeddingEntry {
  id: string;
  question: string;
  stage: string;
  embedding: number[];
}

interface BankEmbeddingCache {
  contentHash: string;
  entries: BankEmbeddingEntry[];
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

/** Hash for the question bank cache, including model and dimension. */
export function questionBankContentHash(): string {
  const hash = createHash("sha256");
  hash.update("question-bank-v1");
  hash.update("\0");
  hash.update(`${EMBED_MODEL}:${EMBED_DIMENSION}`);
  hash.update("\0");
  for (const entry of QUESTION_BANK) {
    hash.update(entry.id);
    hash.update("\0");
    hash.update(entry.question);
    hash.update("\0");
    hash.update(entry.stage);
    hash.update("\0");
  }
  return hash.digest("hex");
}

/** The hash recorded in the bank cache, or null when there is no usable cache. */
export function readBankCacheHash(): string | null {
  if (!fs.existsSync(BANK_CACHE_PATH)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(BANK_CACHE_PATH, "utf-8")) as Partial<BankEmbeddingCache>;
    return typeof parsed.contentHash === "string" ? parsed.contentHash : null;
  } catch {
    return null;
  }
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

  await buildQuestionBankEmbeddings();

  return embeddings;
}

export async function buildQuestionBankEmbeddings() {
  console.log(`Building question bank embeddings for ${QUESTION_BANK.length} questions with ${EMBED_MODEL}...`);

  const batchSize = 96;
  const entries: BankEmbeddingEntry[] = [];

  const questions = QUESTION_BANK.map((q) => q.question);
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const batchEmbeddings = await embedTexts(batch, "search_document");
    for (let j = 0; j < batch.length; j++) {
      const entry = QUESTION_BANK[i + j];
      entries.push({
        id: entry.id,
        question: entry.question,
        stage: entry.stage,
        embedding: batchEmbeddings[j],
      });
    }
  }

  const cache: BankEmbeddingCache = { contentHash: questionBankContentHash(), entries };
  fs.writeFileSync(BANK_CACHE_PATH, JSON.stringify(cache));
  console.log(`Question bank embeddings saved to ${BANK_CACHE_PATH} (hash ${cache.contentHash.slice(0, 12)})`);
  return entries;
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

let cachedBankEmbeddings: BankEmbeddingEntry[] | null = null;

export function loadQuestionBankEmbeddings(): BankEmbeddingEntry[] {
  if (cachedBankEmbeddings) return cachedBankEmbeddings;
  if (!fs.existsSync(BANK_CACHE_PATH)) {
    throw new Error("question-bank-cache.json is missing — run npm run build-embeddings");
  }

  const parsed = (() => {
    try {
      return JSON.parse(fs.readFileSync(BANK_CACHE_PATH, "utf-8")) as
        | Partial<BankEmbeddingCache>
        | BankEmbeddingEntry[];
    } catch (error) {
      console.error("question-bank-cache.json is unreadable", error);
      throw new Error("question-bank-cache.json is unreadable — run npm run build-embeddings");
    }
  })();
  if (Array.isArray(parsed)) {
    throw new Error("question-bank-cache.json predates the content hash — run npm run build-embeddings");
  }
  if (typeof parsed.contentHash !== "string" || parsed.contentHash !== questionBankContentHash()) {
    throw new Error("question-bank-cache.json is stale — run npm run build-embeddings");
  }
  if (!Array.isArray(parsed.entries)) {
    throw new Error("question-bank-cache.json is malformed — run npm run build-embeddings");
  }

  cachedBankEmbeddings = parsed.entries;
  console.log(`Loaded ${cachedBankEmbeddings.length} cached question bank embeddings`);
  return cachedBankEmbeddings;
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
