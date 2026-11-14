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

test("home shows an Also built row of three linked side projects", () => {
  const start = html.indexOf('id="also-built"');
  assert.ok(start !== -1, "the Also built heading is missing");
  const row = html.slice(start, html.indexOf("All projects", start));
  for (const name of ["Glyph", "Omni-Reality", "FLEXFIRE-X"]) {
    assert.ok(row.includes(name), `missing ${name}`);
  }
  assert.ok(!row.includes("Careerly"), "Glyph took Careerly's place");
  const items = row.split('<li class="relative flex flex-col').slice(1);
  assert.equal(items.length, 3);
  for (const item of items) {
    assert.match(item, /after:absolute after:inset-0/, "the whole card follows its first link");
    assert.match(item, /relative z-10 font-medium text-accent/, "the link row keeps its own targets");
  }
  assert.match(row, /github\.com\/HasNate618\/Glyph|WinGet|GitHub/);
  assert.ok(!row.includes("text-3xl"), "no stat tiles");
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

test("the featured cards are compact: one main image, one line, every link, no stack chips", () => {
  const projects = html.slice(html.indexOf('id="projects"'), html.indexOf('id="also-built"'));
  const campusCard = projects.match(/<li id="campus"[\s\S]*?Case study/)?.[0] ?? "";
  assert.ok(campusCard, "Campus should render as the first compact card, keeping the #campus anchor");
  assert.match(campusCard, /href="\/projects\/campus"/, "the title links to the case study");
  assert.doesNotMatch(projects, /rounded-full bg-accent\/10 px-3 py-1/, "no stack chips on home cards");
  assert.doesNotMatch(projects, /SQLite/, "the long covers text stays on /projects");
  assert.doesNotMatch(projects, /Next image \(/, "no buried next-image links");
  // Every image of every featured card has its own thumbnail or square.
  for (const name of ["campus", "clank", "homelab", "aware"]) {
    const count = (projects.match(new RegExp(`id="media-projects-${name}[^"]*-thumb"`, "g")) ?? []).length;
    assert.ok(count >= 1, `${name} has no thumbnail`);
  }
  // AWARE shows its case study, then GitHub and Devpost.
  const aware = projects.slice(projects.indexOf(">AWARE<"));
  const row = aware; // AWARE is the last featured card
  assert.ok(row.indexOf("Case study") < row.indexOf("GitHub") && row.indexOf("GitHub") < row.indexOf("Devpost"), "all links, case study first");
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
  // The home page carries two roles now, then a button; the full record is its
  // own page, covered by tests/views/experience.test.tsx.
  assert.match(html, /TeraGo/);
  assert.match(html, /3D Western/);
  assert.doesNotMatch(html, /WEMars/, "older roles belong to /experience");
  assert.match(html, /href="\/experience"/);
  assert.match(html, /Show all experience/);
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

test("the awards line makes no team claim, since one award was solo", () => {
  assert.match(html, /8 awards across 22 hackathons\./);
  assert.doesNotMatch(html, /all with teams/);
});
