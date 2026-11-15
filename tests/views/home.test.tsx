import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeView } from "../../src/components/views/HomeView";
import { getPage } from "../../src/lib/content";

const page = getPage("/")!;
const html = renderToStaticMarkup(<HomeView page={page} />);

test("home renders identity, seeking and the Campus card", () => {
  assert.match(html, /Nathan Espejo/);
  assert.match(html, /software engineering internship starting May 2027, summer or up to 16 months/);
  assert.match(html, /, graduating May 2028\. Looking for a /);
  assert.match(html, /Campus/);
  assert.ok(!html.includes("text-3xl font-bold"), "cards carry no stat tiles");
  assert.doesNotMatch(html, /4,687/, "the exact chunk count is not published anywhere");
});

test("home names the three side projects in one Also built line", () => {
  const start = html.indexOf('id="also-built"');
  assert.ok(start !== -1, "the Also built line is missing");
  const row = html.slice(start, html.indexOf("All projects", start));
  for (const name of ["Glyph", "Omni-Reality", "FLEXFIRE-X"]) {
    assert.ok(row.includes(name), `missing ${name}`);
  }
  assert.ok(!row.includes("Careerly"), "Glyph took Careerly's place");
  assert.ok(!row.includes("<li"), "the Also built line is text, not cards");
  assert.match(row, /github\.com\/HasNate618\/Glyph/, "the names link out");
  assert.match(row, /\(software\)/);
  assert.match(row, /\(vr\)/);
  assert.match(row, /\(hardware\)/);
});

test("home names the work outside AI in one line", () => {
  assert.match(html, /Outside of AI, I build games, 3D, AR\/VR and hardware for fun\./);
});

test("the home bio is two paragraphs of about 70 words, naming Linux (NixOS) and the graduation date", () => {
  const start = html.indexOf('<h1');
  const bio = html.slice(start, html.indexOf('id="experience"'));
  const paragraphs = bio.match(/<p[\s>]/g)?.length ?? 0;
  assert.equal(paragraphs, 2, "bio should be two paragraphs");
  const words = bio.replace(/<[^>]+>/g, " ").split(/\s+/).filter((w) => /\w/.test(w)).length;
  assert.ok(words >= 60 && words <= 85, `bio is ${words} words`);
  assert.match(bio, /Linux \(NixOS\)/);
  assert.match(bio, /graduating May 2028/);
});

test("home has exactly one h1", () => {
  assert.equal(html.match(/<h1/g)?.length, 1);
});

test("the seeking line comes from site.ts, not from the markdown", () => {
  assert.ok(!page.body.includes("May 2027"), "seeking must not be restated in content");
});

test("the About page carries the short intro copy", () => {
  assert.match(html, /Most of what I build is LLM tooling I use daily/);
  assert.match(html, /a two-machine Linux \(NixOS\) homelab/);
  assert.doesNotMatch(html, /care about the boring parts too/);
});

test("the featured projects render as a text list with one image each: linked name, one line", () => {
  const projects = html.slice(html.indexOf('id="projects"'), html.indexOf('id="also-built"'));
  const campusRow = projects.match(/<li id="campus"[\s\S]*?<\/li>/)?.[0] ?? "";
  assert.ok(campusRow, "Campus should lead the list, keeping the #campus anchor");
  assert.match(campusRow, /href="\/projects\/campus"/, "the name links to the case study");
  assert.match(projects, /<img/, "each project keeps one image");
  assert.doesNotMatch(projects, /rounded-full bg-accent\/10 px-3 py-1/, "no stack chips on home");
  assert.doesNotMatch(projects, /SQLite/, "the long covers text stays on /projects");
  assert.doesNotMatch(projects, /Next image \(/, "no buried next-image links");
  const items = projects.match(/<li(\s|>)/g) ?? [];
  assert.equal(items.length, 4, "the lead plus three featured projects");
});

test("the featured section links to real case studies, and only those", () => {
  for (const id of ["clank", "homelab", "aware"]) {
    assert.ok(html.includes(`href="/projects/${id}"`), `missing case study link for ${id}`);
  }
  // CareBridge moved off Home; it still has no case-study route to link.
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
  // The home page carries two roles now, then a link; the full record is its
  // own page, covered by tests/views/experience.test.tsx.
  assert.match(html, /TeraGo/);
  assert.match(html, /3D Western/);
  assert.doesNotMatch(html, /WEMars/, "older roles belong to /experience");
  assert.match(html, /href="\/experience"/);
  assert.match(html, /All experience/);
});

test("Home features Clank right after the lead, and CareBridge is off Home", () => {
  const projects = html.slice(html.indexOf('id="projects"'), html.indexOf('id="also-built"'));
  const at = (name: string) => projects.indexOf(`>${name}<`);
  assert.ok(at("Campus") < at("Clank") && at("Clank") < at("NixOS homelab") && at("NixOS homelab") < at("AWARE"), "Campus, Clank, homelab, AWARE");
  assert.ok(!projects.includes(">CareBridge<"), "CareBridge lives on /projects now");
});

test("the awards section closes the page with one line, a link to the table and the Dean's Honour List", () => {
  assert.match(html, /id="awards"/);
  assert.match(html, /8 awards across 22 hackathons/);
  assert.match(html, /href="\/projects#hackathon-awards"/);
  assert.doesNotMatch(html, /<table/, "the full table lives on /projects");
  assert.match(html, /Dean&#x27;s Honour List \(2024, 2025\)/);
  assert.ok(html.indexOf('id="projects"') < html.indexOf('id="awards"'), "awards should be the last section");
});

test("the Ask section is gone; the chat lives in the header button", () => {
  assert.doesNotMatch(html, /id="ask"/);
});

test("the featured cards offer their case studies", () => {
  assert.match(html, /Case study/);
  assert.match(html, /href="\/projects\/homelab"/);
});


test("each home experience entry is a short line plus its case study", () => {
  const section = html.slice(html.indexOf('id="experience"'), html.indexOf('id="projects"'));
  assert.doesNotMatch(section, /Qwen3-VL-2B/, "the long summary lives on /experience");
  assert.match(section, /local-LLM prototype/);
  assert.match(section, /print-safety dataset/);
  assert.equal(section.match(/>Case study</g)?.length ?? section.match(/Case study/g)?.length, 2);
});

test("home experience puts the dates above the role instead of in a column", () => {
  const section = html.slice(html.indexOf('id="experience"'), html.indexOf('id="projects"'));
  assert.doesNotMatch(section, /grid-cols-\[10rem_1fr\]/, "the date column pushed every row sideways");
  const terago = section.slice(section.indexOf(">May 2026 to Aug 2026<"), section.indexOf("</li>", section.indexOf("TeraGo")));
  assert.ok(terago.length > 0, "the TeraGo dates should render");
  assert.ok(terago.indexOf("Software Engineering Intern") > 0, "the role follows its dates");
});

test("the awards line makes no team claim, since one award was solo", () => {
  assert.match(html, /8 awards across 22 hackathons\./);
  assert.doesNotMatch(html, /all with teams/);
});
