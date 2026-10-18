import { test } from "node:test";
import assert from "node:assert/strict";
import { pinnedChunks, withCoverageFloor } from "../src/app/api/chat/lib/context";
import { getCorpusDoc } from "../src/lib/corpus";

/** What retrieval actually returned for "What are Nathan's strongest projects?". */
const UNCOVERED = [
  { text: "about > Focus", source: "about.md" },
  { text: "projects > Projects", source: "projects/index.md" },
  { text: "projects > Other projects", source: "projects/other.md" },
  { text: "awards > Hackathon awards", source: "awards.md" },
];

const IMPRESSIVE = "What is the most impressive thing Nathan has built, and why?";

/**
 * The reranked ten retrieval actually returned for that question on 2026-10-17,
 * which is what the conflation was written from: no project and no role in it.
 */
const IMPRESSIVE_RERANK = [
  "about.md",
  "home.md",
  "local-ai.md",
  "about.md",
  "about.md",
  "awards.md",
  "projects/cyberdeck.md",
  "projects/cyberdeck.md",
  "about.md",
  "projects/index.md",
].map((source, index) => ({ text: `${source} chunk ${index}`, source }));

test("a context that already holds a project doc is left alone", () => {
  const chunks = [...UNCOVERED, { text: "Campus", source: "projects/campus.md" }];
  assert.equal(withCoverageFloor(chunks), chunks);
});

test("a context that already holds a role doc is left alone", () => {
  const chunks = [...UNCOVERED, { text: "TeraGo", source: "experience/terago.md" }];
  assert.equal(withCoverageFloor(chunks), chunks);
});

test("an index page is not coverage", () => {
  const out = withCoverageFloor(UNCOVERED);
  assert.ok(out.length > UNCOVERED.length, "the floor must fire");
  assert.deepEqual(out.slice(0, UNCOVERED.length), UNCOVERED, "retrieved chunks keep their order");
});

test("the floor pins the featured projects and the roles", () => {
  const sources = withCoverageFloor(UNCOVERED).map((c) => c.source);
  for (const expected of [
    "projects/campus.md",
    "projects/homelab.md",
    "projects/aware.md",
    "projects/carebridge.md",
    "experience/terago.md",
    "experience/3d-western.md",
  ]) {
    assert.ok(sources.includes(expected), `${expected} was not pinned`);
  }
});

test("a pinned chunk carries the summary, not only scalars", () => {
  const campus = withCoverageFloor(UNCOVERED).find((c) => c.source === "projects/campus.md");
  assert.ok(campus, "Campus must be pinned");
  assert.match(campus.text, /^Summary: /m);
});

test("applying the floor twice adds nothing", () => {
  const once = withCoverageFloor(UNCOVERED);
  assert.deepEqual(withCoverageFloor(once), once);
});

test("a chunk retrieval already returned is not pinned twice", () => {
  const chunks = [...UNCOVERED, { text: "homelab", source: "projects/homelab.md" }];
  const sources = withCoverageFloor(chunks).map((c) => c.source);
  assert.equal(sources.filter((s) => s === "projects/homelab.md").length, 1);
});

test("every pinned chunk names a real corpus document", () => {
  const pinned = pinnedChunks();
  assert.ok(pinned.length >= 6, `expected at least 6 pinned chunks, got ${pinned.length}`);

  for (const chunk of pinned) {
    const doc = getCorpusDoc(chunk.source);
    assert.ok(doc, `${chunk.source} is not in the corpus`);
    assert.ok(chunk.text.length > 20, `${chunk.source} pinned an empty chunk`);
  }
});

/*
 * The floor did not fire for the question that produced the conflation, because
 * projects/cyberdeck.md was in the reranked ten and any project doc counted as
 * coverage. Coverage is the work the home page leads with, not any project.
 */
test("an abandoned project's doc is not coverage", () => {
  const chunks = [...UNCOVERED, { text: "Cyberdeck", source: "projects/cyberdeck.md" }];
  const out = withCoverageFloor(chunks, IMPRESSIVE);
  assert.ok(out.length > chunks.length, "the floor must still fire");
  assert.ok(out.map((c) => c.source).includes("projects/campus.md"), "Campus must be pinned");
});

test("a role that is not on the resume is not coverage", () => {
  const chunks = [...UNCOVERED, { text: "MCC", source: "experience/mcc.md" }];
  assert.ok(withCoverageFloor(chunks, IMPRESSIVE).length > chunks.length);
});

test("the question that produced the conflation now gets the facts", () => {
  const sources = withCoverageFloor(IMPRESSIVE_RERANK, IMPRESSIVE).map((c) => c.source);
  assert.ok(sources.includes("projects/campus.md"), "Campus facts were missing from that answer");
  assert.ok(sources.includes("projects/homelab.md"), "homelab facts were missing from that answer");
});

test("a broad question still gets the pin", () => {
  assert.ok(withCoverageFloor(UNCOVERED, "What are his strongest projects?").length > UNCOVERED.length);
});

test("a question that names a project keeps its own context", () => {
  const chunks = [{ text: "Cyberdeck links", source: "projects/cyberdeck.md" }];
  assert.equal(withCoverageFloor(chunks, "How does Cyberdeck work?"), chunks);
});

test("a question that names a role keeps its own context", () => {
  const chunks = [{ text: "MCC", source: "experience/mcc.md" }];
  assert.equal(withCoverageFloor(chunks, "What did he do at WEMars?"), chunks);
});
