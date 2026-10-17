import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ExperienceView } from "../../src/components/views/ExperienceView";
import { NowView } from "../../src/components/views/NowView";
import { getPage } from "../../src/lib/content";
import { site } from "../../src/data/site";

const page = getPage("/experience")!;
const html = renderToStaticMarkup(<ExperienceView page={page} />);

test("experience renders dates from site.ts verbatim", () => {
  assert.match(html, /May 2026 to Aug 2026/);
  assert.match(html, /Sep 2025 to Aug 2026/);
  assert.doesNotMatch(html, /present/i);
});

test("experience covers all five roles", () => {
  for (const org of ["TeraGo", "3D Western", "WEMars", "WEFirst", "Microcomputer"]) {
    assert.ok(html.includes(org), `missing ${org}`);
  }
});

test("every role in site.ts gets a section, none silently dropped", () => {
  const headings = html.match(/<h2 id="[^"]+"/g) ?? [];
  assert.equal(
    headings.length,
    site.experience.length + 2,
    "one heading per role, plus Education and Hackathons"
  );
});

test("the 3D Western dataset figure resolves from the role, not a project", () => {
  assert.match(html, /4,127/);
  assert.ok(!page.body.includes("4,127"), "the figure must not be typed into content");
});

test("TeraGo links to its case study", () => {
  assert.match(html, /href="\/experience\/terago"/);
});

test("education dates come from site.ts", () => {
  assert.match(html, /Aug 2024 to May 2028 \(expected\)/);
  assert.match(html, /Dean.{0,6}s Honour List/);
});

test("the hackathon line links to the awards table on the home page", () => {
  assert.match(html, /href="\/#awards"/);
  assert.match(html, /8 awards across 22 hackathons/);
});

test("no role bullet is lost when the content file has the wrong number of sections", () => {
  // Guards the sections()/site.experience index pairing: if someone adds a role
  // to site.ts without a `## ` section, the page must not silently drop prose.
  assert.equal(
    page.body.split(/^## /m).length - 1,
    site.experience.length,
    "content/experience.md must have one `## ` section per role, in site.ts order"
  );
});

test("now ends with the ask and a mailto link", () => {
  const now = renderToStaticMarkup(<NowView page={getPage("/now")!} />);
  assert.match(now, /mailto:nate\.e\.espejo@gmail\.com/);
  assert.match(now, /Summer 2027 applied AI engineering internship/);
});

test("now renders its bullets", () => {
  const now = renderToStaticMarkup(<NowView page={getPage("/now")!} />);
  assert.match(now, /<li>/);
  assert.match(now, /Homelab/);
});
