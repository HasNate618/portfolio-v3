import { test } from "node:test";
import assert from "node:assert/strict";
import { getPage, loadFrom, listCorpusFilesFrom, listPages, unresolvedContentLinks } from "../src/lib/content";
import { getCorpusDoc } from "../src/lib/corpus";

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

test("relative .md links in content are rewritten to the routes the site serves", () => {
  const homelab = getPage("/projects/homelab")!;
  assert.match(homelab.body, /\]\(\/projects\/campus\)/, "a page link must point at the route");
  assert.doesNotMatch(homelab.body, /\]\(agntos\.md\)/, "must not point at the corpus file");
  assert.match(homelab.body, /\]\(https:\/\/github\.com\/HasNate618\/AgntOS\)/, "AgntOS has no page");
});

/*
 * A corpus-only doc has no page, so the link has to be resolved against the set
 * of routes rather than guessed, and a link that resolves to nothing is left
 * for check:content to name rather than silently pointed somewhere wrong.
 */
test("link resolution is directory-relative and honest about dead ends", () => {
  const routes = new Map([
    ["awards", "/awards"],
    ["projects/index", "/projects"],
    ["projects/campus", "/projects/campus"],
  ]);
  const from = "projects/homelab";

  assert.deepEqual(unresolvedContentLinks("[Awards](../awards.md)", from, routes), []);
  assert.deepEqual(unresolvedContentLinks("[Index](index.md)", from, routes), []);
  assert.deepEqual(unresolvedContentLinks("[Campus](campus.md#stack)", from, routes), []);
  assert.deepEqual(unresolvedContentLinks("[Nope](nope.md)", from, routes), ["nope.md"]);
  assert.deepEqual(unresolvedContentLinks("[Site](https://x.test/a.md)", from, routes), []);
});

/*
 * The loader rewrites every relative .md link it can resolve and leaves the rest
 * untouched, so anything still matching here points at no page. check:content
 * fails on the same condition; this test is the one that runs in `npm test`.
 */
test("no page links to a .md path", () => {
  for (const page of listPages()) {
    const leftover = page.body.match(/\]\((?!https?:\/\/|\/|#|mailto:)[^)\s]+\.md(?:#[^)\s]*)?\)/g) ?? [];
    assert.deepEqual(leftover, [], `${page.slug} links to a file instead of a page`);
  }
});

test("the one-source marker never reaches a page or the corpus", () => {
  const slug = "experience/3d-western";
  assert.ok(getPage("/experience/3d-western")!.body.includes("212 against 97"), "the figure survives");
  assert.ok(!getPage("/experience/3d-western")!.body.includes("one-source-ok"), "not on the page");
  assert.ok(!getCorpusDoc(`${slug}.md`)!.text.includes("one-source-ok"), "not in the corpus");
});

test("frontmatter is separated from the body", () => {
  const page = loadFrom(FIXTURES).find((p) => p.route === "/")!;
  assert.ok(!page.body.includes("title:"));
  assert.ok(page.body.length > 0);
});

test("a skills block list parses into groups with items", () => {
  const page = loadFrom(FIXTURES).find((p) => p.route === "/")!;
  assert.deepEqual(page.skills, [
    { group: "AI", items: ["RAG", "agents"] },
    { group: "Languages", items: ["Python", "TypeScript"] },
  ]);
});

test("a page without a skills block gets an empty list, not undefined", () => {
  const page = loadFrom(FIXTURES).find((p) => p.route === "/projects/campus")!;
  assert.deepEqual(page.skills, []);
});
