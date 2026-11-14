import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectsView, GROUP_LABELS } from "../../src/components/views/ProjectsView";
import { getPage } from "../../src/lib/content";
import { slugify } from "../../src/lib/markdown";
import { site } from "../../src/data/site";

const page = getPage("/projects")!;
const html = renderToStaticMarkup(<ProjectsView page={page} />);

test("projects renders three open sections and the awards, with no archive", () => {
  assert.equal(html.match(/<h2 /g)?.length, 4, "three section headings plus Hackathon awards");
  for (const h of [
    "Case studies",
    "Hardware, AR and VR",
    "Software, AI and games",
    "Hackathon awards",
  ]) {
    assert.ok(html.includes(h), `missing ${h}`);
  }
  assert.doesNotMatch(html, /<details/);
  assert.doesNotMatch(html, /Archive|older/i);
});

test("the full awards table lives at the bottom of the projects page", () => {
  assert.match(html, /id="hackathon-awards"/);
  assert.match(html, /Hackathon awards:/);
});

test("winning projects wear the accent frame and their prize", () => {
  // Auralis won at Hack Western 12 and CareBridge placed 3rd at Spark, so their cards are framed differently.
  for (const name of ["Auralis", "CareBridge"]) {
    const at = html.indexOf(`>${name}<`);
    const card = html.slice(html.lastIndexOf("relative flex flex-col rounded-lg border p-5", at), at);
    assert.match(card, /border-accent\/50 bg-accent\/5/, `${name} is not framed`);
  }
  assert.match(html, /Overall 3rd place/);
});

test("every project in site.ts is rendered exactly once", () => {
  for (const project of site.projects) {
    const occurrences = html.split(`>${project.name}<`).length - 1;
    assert.ok(occurrences >= 1, `missing project ${project.id}`);
  }
});

test("only projects with a case study are linked", () => {
  assert.match(html, /href="\/projects\/campus"/);
  // Wasteland has no content file, so it must not offer a dead case-study link.
  assert.doesNotMatch(html, /href="\/projects\/wasteland"/);
  // Auralis has a knowledgebase file for the chat corpus but no route, so a
  // file-backed check would still 404. The route table is the only truth.
  assert.doesNotMatch(html, /href="\/projects\/auralis"/);
});

test("on-this-page entries resolve to real heading ids", () => {
  for (const item of page.onThisPage) {
    assert.ok(html.includes(`id="${slugify(item)}"`), `no heading for onThisPage entry ${item}`);
  }
});

test("software comes before hardware, and each compact section runs strongest first", () => {
  const at = (label: string) => html.indexOf(`id="${slugify(label)}"`);
  assert.ok(at("Software, AI and games") !== -1 && at("Hardware, AR and VR") !== -1);
  assert.ok(at("Software, AI and games") < at("Hardware, AR and VR"), "software must come first");
  const pos = (name: string) => html.indexOf(`>${name}<`);
  assert.ok(pos("CareBridge") < pos("Auralis") && pos("Auralis") < pos("Glyph") && pos("Glyph") < pos("ferret"), "software order");
  assert.ok(pos("ferret") < pos("Tic Tac Toe Ultimate"), "the small Unity games sit last");
  assert.ok(pos("Omni-Reality") < pos("FLEXFIRE-X") && pos("FLEXFIRE-X") < pos("VR ODM Gear Sim"), "hardware order");
});

test("the case studies keep their hand-set order on top", () => {
  const pos = (name: string) => html.indexOf(`>${name}<`);
  assert.ok(pos("Campus") < pos("Clank") && pos("Clank") < pos("NixOS homelab") && pos("NixOS homelab") < pos("AWARE"));
  const studies = html.slice(html.indexOf('id="case-studies"'), html.indexOf('id="software-ai-and-games"'));
  assert.equal(studies.match(/<h3/g)?.length, 4, "four case studies: Campus, Clank, homelab, AWARE");
  assert.ok(!studies.includes(">CareBridge<"), "CareBridge has no case study page, so it sits in the grid");
});

test("compact grid images are hidden on phones only, and the grid still has every image", () => {
  const software = html.slice(html.indexOf('id="software-ai-and-games"'), html.indexOf('id="hackathon-awards"'));
  assert.match(software, /class="mb-3 max-sm:hidden"/);
  assert.match(software, /CareBridge Pitch Slide/);
});

test("the former archive projects sit in the software grid, ranked by score, with their links", () => {
  const software = html.slice(html.indexOf('id="software-ai-and-games"'), html.indexOf('id="hardware-ar-and-vr"'));
  for (const id of ["vitalsign", "agntos", "portfolio-v2", "stupid-spotify", "lumen"]) {
    const project = site.projects.find((p) => p.id === id)!;
    assert.ok(project.score, `${id} needs a score`);
    assert.ok(software.includes(`>${project.name}<`), `${project.name} should be in the software grid`);
    for (const link of project.links) assert.ok(software.includes(link.href), `${project.name} lost ${link.label}`);
  }
  const pos = (name: string) => software.indexOf(`>${name}<`);
  assert.ok(pos("Lumen") < pos("ferret"), "awarded and live Lumen ties ferret and wins on the award");
});

test("only the case studies keep stack chips; the rest are a compact grid", () => {
  const studies = html.slice(html.indexOf('id="case-studies"'), html.indexOf('id="software-ai-and-games"'));
  const rest = html.slice(html.indexOf('id="software-ai-and-games"'), html.indexOf('id="hackathon-awards"'));
  assert.match(studies, /rounded-full bg-accent\/10 px-3 py-1/, "case studies keep their stack");
  assert.doesNotMatch(rest, /rounded-full bg-accent\/10 px-3 py-1/, "no stack chips in the compact grid");
  assert.match(rest, /grid gap-4 sm:grid-cols-2/);
});

test("the compact grid hides no image: every image keeps an expanded view", () => {
  for (const project of site.projects) {
    for (const item of project.media ?? []) {
      assert.ok(html.includes(`src="${item.src}"`) || html.includes(encodeURIComponent(item.src)), `${item.src} is no longer on the page`);
    }
  }
});

test("the intro is one line: the team-credit note", () => {
  assert.doesNotMatch(html, /I build across the stack/);
});

test("group labels are the capitalized display form, not the slugs", () => {
  assert.equal(GROUP_LABELS.ai, "AI and LLM");
  assert.doesNotMatch(html, />ai</);
});

test("the solo or team note comes before any team credit", () => {
  const rule = html.indexOf("Hackathon projects are marked solo or team.");
  const firstTeam = html.indexOf("Auralis");
  assert.ok(rule !== -1 && rule < firstTeam, "the honesty rule must precede team credits");
});
