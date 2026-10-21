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

test("homelab leads with the infrastructure, not agent counts", () => {
  for (const heading of ["The two machines", "Networking and remote access", "Storage and backups", "Monitoring and upkeep"]) {
    assert.ok(homelab.includes(heading), `missing ${heading}`);
  }
  for (const value of ["411", "212", "34,673"]) {
    assert.ok(!homelab.includes(value), `${value} should not be on the page`);
  }
});

test("homelab keeps its incident stories", () => {
  assert.match(homelab, /<blockquote>/);
  assert.match(homelab, /NIC driver bug/);
  assert.match(homelab, /dead VPN peer/);
});

test("homelab's figures are accessible and open in the lightbox", () => {
  assert.match(homelab, /<figcaption/);
  for (const src of ["homelab-service-inventory", "homelab-change-loop", "homelab-guardrails"]) {
    assert.ok(homelab.includes(`id="figure-projects-${src}-webp-thumb"`), `${src} has no thumbnail anchor`);
    assert.ok(homelab.includes(`id="figure-projects-${src}-webp"`), `${src} has no overlay`);
  }
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

test("terago says the prototype works end to end", () => {
  assert.match(terago, /email-to-ticket prototype/i);
  assert.match(terago, /works end to end/i);
  assert.doesNotMatch(terago, /automated/i);
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
