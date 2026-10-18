#!/usr/bin/env node
/**
 * Embeddings freshness.
 *
 * The cache stores a hash of the chunks that were embedded. This recomputes that
 * hash from the current corpus and fails when they differ, so a content edit
 * cannot quietly leave the chat answering from the previous text.
 *
 * It lives here rather than in `npm test` so the unit suite does not depend on
 * `build-embeddings` having run last.
 */
import { corpusContentHash, readCacheHash, questionBankContentHash, readBankCacheHash } from "../src/app/api/chat/lib/embeddings.ts";
import { loadKnowledgebase } from "../src/app/api/chat/lib/chunks.ts";

const chunks = loadKnowledgebase();
const expected = corpusContentHash(chunks);
const actual = readCacheHash();

if (!actual) {
  console.error(
    `check:embeddings — no usable hash in embeddings-cache.json (${chunks.length} chunks projected)`
  );
  console.error("  run npm run build-embeddings");
  process.exit(1);
}

if (actual !== expected) {
  console.error("check:embeddings — embeddings are stale");
  console.error(`  cached:  ${actual}`);
  console.error(`  current: ${expected}`);
  console.error("  run npm run build-embeddings");
  process.exit(1);
}

const bankExpected = questionBankContentHash();
const bankActual = readBankCacheHash();
if (!bankActual) {
  console.error("check:embeddings — no usable hash in question-bank-cache.json");
  console.error("  run npm run build-embeddings");
  process.exit(1);
}
if (bankActual !== bankExpected) {
  console.error("check:embeddings — question bank embeddings are stale");
  console.error(`  cached:  ${bankActual}`);
  console.error(`  current: ${bankExpected}`);
  console.error("  run npm run build-embeddings");
  process.exit(1);
}

console.log(`check:embeddings — fresh (${chunks.length} chunks, ${expected.slice(0, 12)}; bank ${bankExpected.slice(0, 12)})`);
