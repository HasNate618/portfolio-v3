import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFrom, listCorpusFilesFrom } from "../src/lib/content";

const FIXTURES = "tests/fixtures/content";

test("route files parse with frontmatter", () => {
  const pages = loadFrom(FIXTURES);
  assert.equal(pages.length, 2);
  assert.ok(pages.every((p) => p.route.startsWith("/")));
  assert.ok(pages.every((p) => p.title.length > 0));
});

test("a file without a route is corpus-only", () => {
  const pages = loadFrom(FIXTURES);
  assert.ok(!pages.some((p) => p.slug === "local-ai"));
  assert.ok(listCorpusFilesFrom(FIXTURES).includes("local-ai.md"));
});

test("slugs are paths relative to content, so index files do not collide", () => {
  const slugs = listCorpusFilesFrom(FIXTURES);
  assert.ok(slugs.includes("index.md"), "the fixture set must contain a root index");
  assert.ok(slugs.includes("projects/index.md"), "and a nested one");
  assert.equal(new Set(slugs).size, slugs.length);
});

test("getPage returns undefined for an unknown route", () => {
  assert.equal(loadFrom(FIXTURES).find((p) => p.route === "/nope"), undefined);
});

test("frontmatter is separated from the body", () => {
  const page = loadFrom(FIXTURES).find((p) => p.route === "/")!;
  assert.ok(!page.body.includes("title:"));
  assert.ok(page.body.length > 0);
});
