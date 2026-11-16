import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeView } from "../../src/components/views/HomeView";
import { getPage } from "../../src/lib/content";
import { site } from "../../src/data/site";

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

test("the Also built row is gone; those projects live on /projects", () => {
  assert.doesNotMatch(html, /id="also-built"/);
  assert.doesNotMatch(html, /Also built/);
  // They still have cards on the projects index, so nothing was lost.
  for (const name of ["Glyph", "Omni-Reality", "FLEXFIRE-X"]) {
    assert.ok(!html.includes(`>${name}<`), `${name} should not be on home`);
  }
});

test("home names the work outside AI in one line", () => {
  assert.match(html, /Outside of AI, I build games, 3D, AR\/VR and hardware for fun\./);
});

test("the home bio is two paragraphs of about 70 words, naming Linux (NixOS) and the graduation date", () => {
  const start = html.indexOf('<h1');
  // Stop at the at-a-glance list: those facts sit beside the bio, not in it.
  const bio = html.slice(start, html.indexOf("<dl"));
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

test("the featured projects are the full case-study cards, whole-card clickable", () => {
  const projects = html.slice(html.indexOf('id="projects"'), html.indexOf('id="awards"'));
  assert.match(projects, /id="campus"/, "Campus leads the list and keeps its #campus anchor");
  assert.match(projects, /href="\/projects\/campus"/, "the title links to the case study");
  assert.match(projects, /<img/, "each card keeps its images");
  assert.match(projects, /rounded-full bg-accent\/10 px-3 py-1/, "the case-study cards carry the stack");
  assert.match(projects, /SQLite/, "and the full covers paragraph");
  assert.equal(projects.match(/relative rounded-lg border p-6/g)?.length, 4, "the lead plus three featured projects");
  assert.equal(projects.match(/after:absolute after:inset-0/g)?.length, 4, "the whole card follows its title link");
  assert.equal(projects.match(/h-auto w-full/g)?.length, 4, "each card carries one lead image");
});

test("a card's images sit above the stretched title link, so they open the viewer", () => {
  const projects = html.slice(html.indexOf('id="projects"'), html.indexOf('id="awards"'));
  // z-10 on the thumbnail anchor beats the title's inset-0 overlay.
  assert.match(projects, /class="relative z-10 block cursor-zoom-in"/);
  assert.match(projects, /href="#media-projects-campus-0-webp"/, "the thumbnail opens its own overlay");
});

test("each card lists its outward links, GitHub included", () => {
  const clank = html.slice(html.indexOf('id="projects"'), html.indexOf('id="awards"'));
  assert.match(clank, /href="https:\/\/github\.com\/HasNate618\/Clank"/, "the GitHub door is on the card");
  assert.match(clank, /relative z-10 font-medium text-accent/, "and it keeps its own target above the card link");
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

test("home lists every role, because it is now the only experience page", () => {
  const experience = html.slice(html.indexOf('id="experience"'), html.indexOf('id="projects"'));
  for (const org of ["WEMars", "TeraGo", "3D Western", "WEFirst Robotics", "Microcomputer Consulting Inc."]) {
    assert.match(experience, new RegExp(org.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `missing ${org}`);
  }
  assert.match(experience, /mt-6 flex flex-col gap-6/, "one card per row, all the way down");
  assert.doesNotMatch(experience, /grid-cols-2/, "no side-by-side roles");
  assert.doesNotMatch(html, /href="\/experience"/, "the index route is gone");
  assert.doesNotMatch(html, /All experience/, "and so is its link");
});

test("Home features Clank right after the lead, and CareBridge is off Home", () => {
  const projects = html.slice(html.indexOf('id="projects"'), html.indexOf('id="awards"'));
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


test("each home experience entry is a card of bullets plus its case study", () => {
  const section = html.slice(html.indexOf('id="experience"'), html.indexOf('id="projects"'));
  assert.doesNotMatch(section, /Qwen3-VL-2B/, "the benchmark detail stays on the case study");
  assert.match(section, /ROS 2, Nav2, Gazebo and a Jetson Orin/, "the bullets carry the work");
  assert.match(section, /2,559 VLM-checked 3D models/);
  assert.equal(section.match(/Read the case study/g)?.length, 2, "TeraGo and 3D Western have case studies");
  // Roles are cards, like the projects: a surface, a border, and the
  // case-study link stretched over the whole box so the row is clickable.
  assert.equal(
    section.match(/relative rounded-lg border border-rule bg-surface p-5/g)?.length,
    5,
    "each of the five roles is a card",
  );
  assert.match(section, /text-xl font-medium leading-snug text-fg/, "the role is the card's title");
  assert.match(section, /hover:text-fg after:absolute after:inset-0/);
});

test("the line after the projects counts the rest and lands past the four shown", () => {
  const rest = site.projects.length - 4;
  assert.ok(html.includes(`and ${rest} more`), "the count excludes the cards above");
  assert.match(
    html,
    /href="\/projects#software-ai-and-games"/,
    "it opens the section after the case studies, not the top of the page",
  );
  assert.doesNotMatch(html, /All projects <span/, "the home page no longer offers the bare index");
});

test("each role card leads with the company, then the role, then where and when", () => {
  const section = html.slice(html.indexOf('id="experience"'), html.indexOf('id="projects"'));
  const wemars = section.slice(section.indexOf("WEMars"), section.indexOf("TeraGo"));
  assert.ok(wemars.indexOf("Software Team Member") > 0, "the role sits under the company");
  assert.match(wemars, /London, ON · Sep 2026 to Present/, "and above where and when");
  assert.match(section, /Markham, ON · May 2026 to Aug 2026/);
  assert.match(section, /VP of Data\/ML \(promoted from Software Developer\)/);
});

test("the awards line makes no team claim, since one award was solo", () => {
  assert.match(html, /8 awards across 22 hackathons\./);
  assert.doesNotMatch(html, /all with teams/);
});
