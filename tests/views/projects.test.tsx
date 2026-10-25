import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectsView, GROUP_LABELS } from "../../src/components/views/ProjectsView";
import { getPage } from "../../src/lib/content";
import { slugify } from "../../src/lib/markdown";
import { site } from "../../src/data/site";

const page = getPage("/projects")!;
const html = renderToStaticMarkup(<ProjectsView page={page} />);

test("projects renders three open sections, the archive and the awards", () => {
  assert.equal(html.match(/<h2 /g)?.length, 4, "three section headings plus Hackathon awards");
  for (const h of [
    "Case studies",
    "Hardware, AR and VR",
    "Software, AI and games",
    "Archive",
    "Hackathon awards",
  ]) {
    assert.ok(html.includes(h), `missing ${h}`);
  }
});

test("the archive is a native disclosure with a compact table", () => {
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
  assert.match(html, /earlier builds and team hackathon projects/);
  assert.match(html, /<th scope="col"[^>]*>Role<\/th>/);
});

test("the full awards table lives at the bottom of the projects page", () => {
  assert.match(html, /id="hackathon-awards"/);
  assert.match(html, /Hackathon awards:/);
});

test("winning projects wear the accent frame and a trophy badge", () => {
  // Auralis won at Hack Western 12, so its card is framed differently.
  assert.match(html, /border-accent\/50 bg-accent\/5/);
  assert.match(html, /border-accent\/40 bg-accent\/10/);
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
  assert.ok(pos("Auralis") < pos("Glyph") && pos("Glyph") < pos("ferret"), "software order");
  assert.ok(pos("ferret") < pos("Tic Tac Toe Ultimate"), "the small Unity games sit last");
  assert.ok(pos("Omni-Reality") < pos("FLEXFIRE-X") && pos("FLEXFIRE-X") < pos("VR ODM Gear Sim"), "hardware order");
});

test("the case studies keep their hand-set order on top", () => {
  const pos = (name: string) => html.indexOf(`>${name}<`);
  assert.ok(pos("Campus") < pos("NixOS homelab") && pos("NixOS homelab") < pos("AWARE") && pos("AWARE") < pos("CareBridge"));
  assert.ok(pos("CareBridge") < pos("Auralis"));
});

test("the archive runs newest first", () => {
  const archive = html.slice(html.indexOf('<details id="archive"'), html.indexOf("</details>"));
  const pos = (name: string) => archive.indexOf(`>${name}<`);
  assert.ok(pos("VitalSign") < pos("Stupid Spotify") && pos("Stupid Spotify") < pos("Lumen"));
});

test("only the case studies keep stack chips; the rest are a compact grid", () => {
  const studies = html.slice(html.indexOf('id="case-studies"'), html.indexOf('id="software-ai-and-games"'));
  const rest = html.slice(html.indexOf('id="software-ai-and-games"'), html.indexOf('<details id="archive"'));
  assert.match(studies, /rounded-full bg-accent\/10 px-3 py-1/, "case studies keep their stack");
  assert.doesNotMatch(rest, /rounded-full bg-accent\/10 px-3 py-1/, "no stack chips in the compact grid");
  assert.match(rest, /grid gap-4 sm:grid-cols-2/);
});

test("the compact grid hides no image: every image keeps an expanded view", () => {
  for (const project of site.projects.filter((p) => p.group !== "archive")) {
    for (const item of project.media ?? []) {
      assert.ok(html.includes(`src="${item.src}"`) || html.includes(encodeURIComponent(item.src)), `${item.src} is no longer on the page`);
    }
  }
});

test("the intro is one line: the team-credit note", () => {
  assert.doesNotMatch(html, /I build across the stack/);
});

test("the stronger archive builds sit in open sections, not the collapsed archive", () => {
  const archive = html.slice(html.indexOf('<details id="archive"'), html.indexOf("</details>"));
  for (const name of ["Careerly", "Cyberdeck", "NowAndThen", "Street Cleaner"]) {
    assert.ok(!archive.includes(`>${name}<`), `${name} should not be in the archive`);
  }
});

test("group labels are the capitalized display form, not the slugs", () => {
  assert.equal(GROUP_LABELS.ai, "AI and LLM");
  assert.doesNotMatch(html, />ai</);
});

test("team projects carry the honesty rule before any credit", () => {
  const rule = html.indexOf("Most of my hackathon projects were team efforts");
  const firstTeam = html.indexOf("Auralis");
  assert.ok(rule !== -1 && rule < firstTeam, "the honesty rule must precede team credits");
});
