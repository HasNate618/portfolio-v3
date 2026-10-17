import { test } from "node:test";
import assert from "node:assert/strict";
import { isNavigationDoc } from "../src/app/api/chat/lib/rag";
import { loadKnowledgebase, splitIntoChunks } from "../src/app/api/chat/lib/chunks";

test("the index maps are treated as navigation", () => {
  for (const source of ["index.md", "projects/index.md", "experience/index.md", "projects/other.md"]) {
    assert.ok(isNavigationDoc(source), `${source} should be demoted`);
  }
});

test("a chunk that says evaluation is in progress also names Campus", () => {
  const hit = loadKnowledgebase().find((chunk) => chunk.text.includes("evaluation in progress"));
  assert.ok(hit, "expected a chunk containing the Campus evaluation status");
  assert.match(hit.text, /Campus/);
  assert.equal(hit.source, "projects/campus.md");
  assert.equal(hit.section, "Results");
});

test("every chunk stays within the 1,200 character limit", () => {
  for (const chunk of loadKnowledgebase()) {
    assert.ok(
      chunk.length <= 1200,
      `${chunk.source} > ${chunk.section} is ${chunk.length} characters`
    );
  }
});

test("long lists split only between complete items", () => {
  const items = Array.from(
    { length: 20 },
    (_, index) => `- Item ${index}: ${"detail ".repeat(10).trim()}.`
  );
  const chunks = splitIntoChunks(
    `---\ntitle: List\n---\n# List\n\n## Items\n\n${items.join("\n")}`,
    "list.md",
    { title: "List", type: "page" }
  );

  for (const item of items) {
    assert.ok(chunks.some((chunk) => chunk.text.includes(item)), `split list item ${item}`);
  }
});

test("long tables split between rows with their headers repeated", () => {
  const rows = Array.from({ length: 30 }, (_, index) => `| Row ${index} | ${"value ".repeat(6)} |`);
  const chunks = splitIntoChunks(
    `---\ntitle: Table\n---\n# Table\n\n## Data\n\n| Name | Value |\n|---|---|\n${rows.join("\n")}`,
    "table.md",
    { title: "Table", type: "page" }
  );

  for (const chunk of chunks) {
    if (!chunk.text.includes("| Row")) continue;
    assert.match(chunk.text, /\| Name \| Value \|\n\|---\|---\|/);
  }
  for (const row of rows) {
    assert.ok(chunks.some((chunk) => chunk.text.includes(row)), `split table row ${row}`);
  }
});

test("real documents are not demoted", () => {
  for (const source of [
    "projects/campus.md",
    "projects/homelab.md",
    "experience/terago.md",
    "about.md",
    "local-ai.md",
    "skills.md",
    "awards.md",
    "resume.md",
  ]) {
    assert.ok(!isNavigationDoc(source), `${source} must not be demoted`);
  }
});
