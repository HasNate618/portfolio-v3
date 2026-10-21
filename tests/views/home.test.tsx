import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeView } from "../../src/components/views/HomeView";
import { getPage } from "../../src/lib/content";

const page = getPage("/")!;
const html = renderToStaticMarkup(<HomeView page={page} />);

test("home renders identity, seeking and the Campus card", () => {
  assert.match(html, /Nathan Espejo/);
  assert.match(html, /Summer 2027 software engineering or applied AI internship/);
  assert.match(html, /, graduating May 2028\. Looking for a /);
  assert.match(html, /Campus/);
  assert.match(html, /courses, in daily use/);
  assert.match(html, /403/);
  assert.doesNotMatch(html, /4,687/, "the exact chunk count is not published anywhere");
});

test("home has exactly one h1", () => {
  assert.equal(html.match(/<h1/g)?.length, 1);
});

test("the seeking line comes from site.ts, not from the markdown", () => {
  assert.ok(!page.body.includes("Summer 2027"), "seeking must not be restated in content");
});

test("the featured section links to real case studies, and only those", () => {
  for (const id of ["homelab", "aware"]) {
    assert.ok(html.includes(`href="/projects/${id}"`), `missing case study link for ${id}`);
  }
  // CareBridge is a featured card with no case-study route, so its title is
  // plain text rather than a link that 404s.
  assert.ok(!html.includes('href="/projects/carebridge"'), "CareBridge has no case study page");
});

test("every project link on the home page resolves to a real page", () => {
  // Media anchors point at the asset itself (ProjectMedia links the full-size
  // image), so only extension-less hrefs are page routes.
  const hrefs = [...html.matchAll(/href="(\/projects\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => !/\.[a-z0-9]+$/i.test(href));
  assert.ok(hrefs.length > 0, "expected at least one project link");
  for (const href of hrefs) {
    assert.ok(getPage(href), `${href} links to a page that does not exist`);
  }
});

test("home on-this-page entries match the heading ids it renders", () => {
  for (const item of page.onThisPage) {
    const id = item.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    assert.ok(html.includes(`id="${id}"`), `no heading rendered for onThisPage entry ${item}`);
  }
});

test("home trims experience to the newest roles and links to the rest", () => {
  // The home page carries two roles now, then a button; the full record is its
  // own page, covered by tests/views/experience.test.tsx.
  assert.match(html, /TeraGo/);
  assert.match(html, /3D Western/);
  assert.doesNotMatch(html, /WEMars/, "older roles belong to /experience");
  assert.match(html, /href="\/experience"/);
  assert.match(html, /Show all experience/);
});

test("the Campus card links out to real anchors", () => {
  // Email lives in the header icon row now, not on the page body.
  assert.match(html, /github\.com\/HasNate618/);
});

test("the awards section closes the page, table and Dean's Honour List included", () => {
  assert.match(html, /id="awards"/);
  assert.match(html, /<caption/);
  assert.match(html, /scope="col"/);
  assert.match(html, /Dean&#x27;s Honour List \(2024, 2025\)/);
  assert.ok(html.indexOf('id="projects"') < html.indexOf('id="awards"'), "awards should be the last section");
});

test("the Ask section is gone; the chat lives in the header button", () => {
  assert.doesNotMatch(html, /id="ask"/);
});

test("the featured cards offer their outward links", () => {
  // Homelab and aware both have case-study routes and external links.
  assert.match(html, /Case study/);
  assert.match(html, /href="\/projects\/homelab"/);
});

test("CareBridge is an award-winning featured card", () => {
  assert.match(html, /CareBridge/);
  assert.match(html, /border-accent\/50 bg-accent\/5/);
});
