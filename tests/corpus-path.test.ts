import { test } from "node:test";
import assert from "node:assert/strict";
import { loadKnowledgebase } from "../src/app/api/chat/lib/chunks";

test("the indexer reads the content/ tree", () => {
  const chunks = loadKnowledgebase();
  assert.ok(chunks.length > 0, "corpus is empty");
  assert.ok(
    chunks.some((c) => c.source === "projects/campus.md"),
    "expected a source relative to the corpus root"
  );
  assert.ok(!chunks.some((c) => c.source.startsWith("knowledgebase/")));
});
