import { test } from "node:test";
import assert from "node:assert/strict";
import { getCorpusDocs, getCorpusDoc } from "../src/lib/corpus";
import { site } from "../src/data/site";

test("served documents keep public frontmatter and strip page-only keys", () => {
  for (const doc of getCorpusDocs()) {
    assert.ok(doc.text.startsWith("---"), `${doc.path} is missing frontmatter`);
    assert.match(doc.text, /^title:/m, `${doc.path} is missing its title`);
    assert.match(doc.text, /^type:/m, `${doc.path} is missing its type`);
    assert.doesNotMatch(doc.text, /^route:/m, `${doc.path} leaked its route`);
    assert.doesNotMatch(doc.text, /^onThisPage:/m, `${doc.path} leaked page navigation`);
    assert.doesNotMatch(doc.text, /^starters:/m, `${doc.path} leaked chat UI starters`);
    assert.doesNotMatch(doc.text, /^skills:/m, `${doc.path} leaked resume-only layout data`);
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
  assert.match(campus.text, /308/, "stats must survive projection");
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

test("AWARE is not described as offline", () => {
  const aware = getCorpusDoc("projects/aware.md")!;
  assert.match(aware.text, /No cloud inference, but not offline/);
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

test("every file-backed project doc carries its card summary", () => {
  const backed = site.projects.filter((p) => p.file);
  assert.ok(backed.length > 0, "no project links a knowledgebase doc");

  for (const project of backed) {
    const rel = project.file!.replace("/knowledgebase/", "");
    const doc = getCorpusDoc(rel);
    assert.ok(doc, `${rel} must be in the corpus`);
    assert.match(doc.text, /^Summary: /m, `${rel} has no Summary line`);
    assert.ok(doc.text.includes(project.covers), `${rel} is missing its card text`);
  }
});

test("an experience doc carries its summary", () => {
  const terago = getCorpusDoc("experience/terago.md")!;
  assert.match(terago.text, /^Summary: Built a working outage-email parser/m);
});

test("a Summary line is never empty or the word undefined", () => {
  for (const doc of getCorpusDocs()) {
    const line = /^Summary: (.*)$/m.exec(doc.text)?.[1];
    if (line === undefined) continue;
    assert.ok(line.trim().length > 20, `${doc.path} has a stub Summary`);
    assert.notEqual(line.trim(), "undefined", `${doc.path} wrote undefined`);
  }
});
