import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeView } from "../../src/components/views/HomeView";
import { getPage } from "../../src/lib/content";

const page = getPage("/")!;
const html = renderToStaticMarkup(<HomeView page={page} />);

test("home renders identity, seeking and the Campus card", () => {
  assert.match(html, /Nathan Espejo/);
  assert.match(html, /Summer 2027 applied AI engineering internship/);
  assert.match(html, /Campus/);
  assert.match(html, /4,687/);
  assert.match(html, /308/);
});

test("home has exactly one h1", () => {
  assert.equal(html.match(/<h1/g)?.length, 1);
});

test("the seeking line comes from site.ts, not from the markdown", () => {
  assert.ok(!page.body.includes("Summer 2027"), "seeking must not be restated in content");
});

test("the featured section links to real case studies", () => {
  for (const id of ["homelab", "aware"]) {
    assert.ok(html.includes(`href="/projects/${id}"`), `missing case study link for ${id}`);
  }
});

test("home on-this-page entries match the heading ids it renders", () => {
  for (const item of page.onThisPage) {
    const id = item.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    assert.ok(html.includes(`id="${id}"`), `no heading rendered for onThisPage entry ${item}`);
  }
});

test("every experience row is rendered", () => {
  for (const experience of ["TeraGo", "3D Western", "WEMars", "WEFirst Robotics"]) {
    assert.ok(html.includes(experience), `missing ${experience}`);
  }
});

test("the Campus card links out to real anchors", () => {
  // Email lives in the header icon row now, not on the page body.
  assert.match(html, /github\.com\/HasNate618/);
});
