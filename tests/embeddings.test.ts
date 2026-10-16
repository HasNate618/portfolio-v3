import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { corpusContentHash } from "../src/app/api/chat/lib/embeddings";
import { EMBED_MODEL, EMBED_DIMENSION } from "../src/app/api/chat/lib/cohere";

const read = (relative: string) =>
  readFileSync(new URL(`../src/app/api/chat/lib/${relative}`, import.meta.url), "utf8");

test("the cache hash covers the embedder identity, not just the text", () => {
  const chunks = [{ text: "Campus is a study assistant.", source: "projects/campus.md" }];
  const withModel = corpusContentHash(chunks);

  const textOnly = createHash("sha256")
    .update(chunks[0].source)
    .update("\0")
    .update(chunks[0].text)
    .update("\0")
    .digest("hex");

  assert.notEqual(
    withModel,
    textOnly,
    "swapping the embedding model must invalidate the index, or queries would be compared across embedding spaces"
  );
});

test("the hash is stable for identical input", () => {
  const chunks = [{ text: "a", source: "a.md" }];
  assert.equal(corpusContentHash(chunks), corpusContentHash([...chunks]));
});

test("the index and the query embed through the same call site", () => {
  assert.match(read("embeddings.ts"), /embedTexts\(/, "the index must use embedTexts");
  assert.match(read("rag.ts"), /embedTexts\(/, "the query must use embedTexts");
});

test("neither path calls the embed API directly", () => {
  for (const file of ["embeddings.ts", "rag.ts"]) {
    assert.doesNotMatch(
      read(file),
      /\.v2\.embed\(|cohere\.embed\(/,
      `${file} bypasses the shared call site`
    );
  }
});

test("the model and dimension are declared once, in cohere.ts", () => {
  assert.equal(EMBED_MODEL, "embed-v5.0-pro");
  assert.ok([256, 512, 768, 1024, 1536, 2048].includes(EMBED_DIMENSION));

  for (const file of ["embeddings.ts", "rag.ts"]) {
    assert.doesNotMatch(read(file), /embed-v\d/, `${file} hardcodes a model name`);
  }
});

test("the dimension is pinned rather than left to the API default", () => {
  assert.match(read("cohere.ts"), /outputDimension: EMBED_DIMENSION/);
});
