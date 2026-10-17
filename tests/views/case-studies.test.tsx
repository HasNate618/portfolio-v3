import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { CaseStudy } from "../../src/components/CaseStudy";
import { getPage } from "../../src/lib/content";

const homelab = renderToStaticMarkup(
  <CaseStudy page={getPage("/projects/homelab")!} backHref="/projects" backLabel="all projects" />
);

const aware = renderToStaticMarkup(
  <CaseStudy page={getPage("/projects/aware")!} backHref="/projects" backLabel="all projects" />
);

const terago = renderToStaticMarkup(
  <CaseStudy
    page={getPage("/experience/terago")!}
    backHref="/experience"
    backLabel="experience"
  />
);

test("homelab carries its own figures via the stat placeholders", () => {
  for (const value of ["472", "58,000", "191", "27"]) {
    assert.ok(homelab.includes(value), `missing ${value}`);
  }
});

test("homelab keeps its two 'what broke' asides", () => {
  assert.match(homelab, /<blockquote>/);
  assert.match(homelab, /VPN lockout/);
  assert.match(homelab, /NIC driver bug/);
});

test("homelab's diagram is an accessible figure", () => {
  assert.match(homelab, /<pre[^>]*aria-hidden="true"/);
  assert.match(homelab, /<figcaption class="sr-only">I ask an agent for a change/);
});

test("aware renders a captioned model table", () => {
  assert.match(aware, /<caption/);
  assert.match(aware, /scope="col"/);
  assert.match(aware, /YOLOv8n/);
  assert.match(aware, /MiniCPM5-1B/);
});

test("aware's board cost comes from site.ts", () => {
  assert.match(aware, /\$80/);
  assert.ok(!getPage("/projects/aware")!.body.includes("$80"), "the figure must not be typed in");
});

test("terago states it is internal work and links back to experience", () => {
  assert.match(terago, /no code or screenshots/i);
  assert.match(terago, /href="\/experience"/);
});

test("terago shows an experience meta row, not a project one", () => {
  assert.match(terago, /May 2026 to Aug 2026/);
  assert.match(terago, /Markham, ON/);
  assert.match(terago, /Software Engineering Intern/);
});

test("terago says the parser works but is not deployed", () => {
  assert.match(terago, /outage-email parser/i);
  assert.match(terago, /not deployed/i);
  assert.doesNotMatch(terago, /automated/i);
});

test("terago's 760 test cases come from site.ts", () => {
  assert.match(terago, /760/);
  assert.ok(!getPage("/experience/terago")!.body.includes("760"), "must not be typed in");
});

test("no case study ever says 'present'", () => {
  for (const [name, html] of Object.entries({ homelab, aware, terago })) {
    assert.doesNotMatch(html, /present/i, `${name} leaked the raw site.ts wording`);
  }
});

test("every on-this-page entry across the three pages has a heading", () => {
  for (const route of ["/projects/homelab", "/projects/aware", "/experience/terago"]) {
    const page = getPage(route)!;
    const html = renderToStaticMarkup(
      <CaseStudy page={page} backHref="/projects" backLabel="back" />
    );
    for (const item of page.onThisPage) {
      const id = item.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      assert.ok(html.includes(`id="${id}"`), `${route}: no heading for ${item}`);
    }
  }
});
