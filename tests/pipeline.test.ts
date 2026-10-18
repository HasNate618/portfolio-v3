import { test } from "node:test";
import assert from "node:assert/strict";
import { toDocuments } from "../src/app/api/chat/lib/pipeline";

/*
 * A document is keyed by source *and* section. Keying by source alone would drop the
 * retrieved "Results" chunk whenever a topic pin for the same file was present, which
 * is the opposite of what the pin is for: the pin carries the summary, retrieval
 * carries the detail.
 */
test("two sections of one doc both survive", () => {
  const docs = toDocuments([
    { text: "Campus is a study assistant.", source: "projects/campus.md" },
    { text: "Results text", source: "projects/campus.md", section: "Results" },
  ]);

  assert.deepEqual(
    docs.map((doc) => doc.id),
    ["projects/campus.md#body", "projects/campus.md#Results"],
  );
  assert.equal(docs[0].data.title, "projects/campus.md > body");
  assert.equal(docs[1].data.title, "projects/campus.md > Results");
});

/*
 * Cohere rejects the whole request when a document id contains whitespace:
 * "invalid request: document id contains whitespace for document index 0". Sections
 * are prose, so an id built from one has to be made safe. The title keeps the section
 * as written, because a person reads that and a machine reads the id.
 */
test("a document id carries no whitespace, whatever the section is called", () => {
  const docs = toDocuments([{ text: "x", source: "about.md", section: "Focus areas" }]);

  assert.equal(docs[0].id, "about.md#Focus-areas");
  assert.doesNotMatch(docs[0].id, /\s/, `${docs[0].id} still has whitespace`);
  assert.equal(docs[0].data.title, "about.md > Focus areas");
});

test("the same section twice is one document", () => {
  const docs = toDocuments([
    { text: "first", source: "projects/campus.md", section: "Results" },
    { text: "second", source: "projects/campus.md", section: "Results" },
  ]);

  assert.equal(docs.length, 1);
  assert.equal(docs[0].data.snippet, "first", "the earlier chunk wins");
});

test("order is kept, so the pins lead", () => {
  const docs = toDocuments([
    { text: "pin", source: "projects/campus.md" },
    { text: "chunk", source: "about.md", section: "Focus" },
  ]);

  assert.deepEqual(
    docs.map((doc) => doc.id),
    ["projects/campus.md#body", "about.md#Focus"],
  );
});

test("the snippet is the chunk text, unchanged", () => {
  const docs = toDocuments([{ text: "line one\nline two", source: "about.md", section: "Focus" }]);
  assert.equal(docs[0].data.snippet, "line one\nline two");
});
