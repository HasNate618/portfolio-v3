import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CaseStudy } from "../../src/components/CaseStudy";
import { getPage } from "../../src/lib/content";

const page = getPage("/projects/campus")!;
const html = renderToStaticMarkup(
  <CaseStudy
    page={page}
    backHref="/projects"
    backLabel="all projects"
    nextHref="/projects/homelab"
    nextLabel="Homelab"
  />
);

test("Campus renders its sections and figures", () => {
  for (const h of ["tl;dr", "Why I built it", "How it works", "Models and cost", "Results", "Stack"]) {
    assert.ok(html.includes(h), `missing ${h}`);
  }
  assert.match(html, /just over 200 of them as of early October 2026/);
  assert.match(html, /308/);
});

test("the on-this-page list links to real heading ids", () => {
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(html.includes(`id="${m[1]}"`), `dangling anchor ${m[1]}`);
  }
});

test("the meta row shows 'now', never 'present'", () => {
  assert.doesNotMatch(html, /present/i);
});

test("back and next links are parameterized", () => {
  assert.match(html, /href="\/projects"/);
  assert.match(html, /href="\/projects\/homelab"/);
});

test("every on-this-page entry has a heading, including ones the template renders", () => {
  for (const item of page.onThisPage) {
    const id = item.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    assert.ok(html.includes(`id="${id}"`), `no heading for onThisPage entry ${item}`);
  }
});

test("the diagram is hidden from assistive tech and captioned instead", () => {
  assert.match(html, /<pre[^>]*aria-hidden="true"/);
  assert.match(html, /<figcaption class="sr-only">Brightspace syncs into SQLite/);
});

test("no figure is typed into the content file", () => {
  for (const figure of ["4,687", "215", "308"]) {
    assert.ok(!page.body.includes(figure), `${figure} must come from site.ts, not the markdown`);
  }
  assert.match(page.body, /\{\{stat:campus\.tests\}\}/);
  // The file count is dated prose rather than a stat, so it cannot be resolved from site.ts.
  assert.match(page.body, /just over 200 of them as of early October 2026/);
});

test("the stack renders from site.ts rather than the markdown", () => {
  assert.match(html, /FastAPI/);
  assert.ok(!page.body.includes("FastAPI"), "the stack list must not be restated in content");
});
