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

test("the floor pins the flagship, the other featured projects and the roles", () => {
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
  assert.ok(campus, "the flagship must be pinned");
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
