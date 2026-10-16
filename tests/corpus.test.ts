import { test } from "node:test";
import assert from "node:assert/strict";
import { getCorpusDocs, getCorpusDoc } from "../src/lib/corpus";

test("no served document leaks frontmatter", () => {
  for (const doc of getCorpusDocs()) {
    assert.ok(!doc.text.startsWith("---"), `${doc.path} starts with frontmatter`);
    assert.ok(!/^title:/m.test(doc.text), `${doc.path} contains frontmatter keys`);
  }
});

test("relative .md links become absolute knowledgebase URLs", () => {
  const campus = getCorpusDoc("projects/campus.md")!;
  assert.ok(campus, "projects/campus.md must be in the corpus");
  assert.ok(!/\]\(\.\.?\//.test(campus.text), "relative link survived projection");
});

test("stat placeholders never survive into the corpus", () => {
  for (const doc of getCorpusDocs()) {
    assert.ok(!doc.text.includes("{{stat:"), `${doc.path} has an unresolved placeholder`);
  }
});

test("a route document keeps the facts only components render", () => {
  const campus = getCorpusDoc("projects/campus.md")!;
  assert.match(campus.text, /Aug 2026/, "dates must survive projection");
  assert.match(campus.text, /FastAPI/, "stack must survive projection");
  assert.match(campus.text, /4,687/, "stats must survive projection");
});

test("an experience document keeps its dates and role", () => {
  const terago = getCorpusDoc("experience/terago.md")!;
  assert.match(terago.text, /May 2026 to Aug 2026/);
  assert.match(terago.text, /Software Engineering Intern/);
});

test("lookup is exact, not normalized", () => {
  assert.equal(getCorpusDoc("projects/../about.md"), undefined);
  assert.equal(getCorpusDoc("./about.md"), undefined);
});

test("every corpus path is unique and relative", () => {
  const paths = getCorpusDocs().map((d) => d.path);
  assert.equal(new Set(paths).size, paths.length, "duplicate corpus path");
  assert.ok(paths.every((p) => !p.startsWith("/") && !p.includes("..")));
});

test("a ranked project's doc states its rank, so the flagship is retrievable", () => {
  assert.match(getCorpusDoc("projects/campus.md")!.text, /^Rank: flagship project$/m);
  assert.match(getCorpusDoc("projects/homelab.md")!.text, /^Rank: featured project$/m);
});

test("an unranked project's doc claims no rank", () => {
  assert.doesNotMatch(getCorpusDoc("projects/glyph.md")!.text, /^Rank:/m);
});
