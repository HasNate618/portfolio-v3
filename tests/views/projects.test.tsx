import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectsView, GROUP_LABELS } from "../../src/components/views/ProjectsView";
import { getPage } from "../../src/lib/content";
import { slugify } from "../../src/lib/markdown";
import { site } from "../../src/data/site";

const page = getPage("/projects")!;
const html = renderToStaticMarkup(<ProjectsView page={page} />);

test("projects renders every group label", () => {
  for (const h of [
    "Case studies",
    "AI and LLM",
    "Hardware and embedded",
    "AR and VR",
    "Tools and apps",
    "Games",
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

test("hardware and XR come before AI, and games have their own section", () => {
  const at = (label: string) => html.indexOf(`id="${slugify(label)}"`);
  assert.ok(at("Hardware and embedded") < at("AI and LLM"), "hardware must come before AI");
  assert.ok(at("AR and VR") < at("AI and LLM"), "XR must come before AI");
  assert.ok(at("Games") !== -1, "games section missing");
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
