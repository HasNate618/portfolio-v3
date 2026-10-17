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
    "Featured",
    "Also building",
    "AI and ML",
    "Hackathon team projects",
    "Hardware",
    "Web and mobile",
    "Games and smaller builds",
  ]) {
    assert.ok(html.includes(h), `missing ${h}`);
  }
});

test("the games list is a native disclosure", () => {
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
});

test("the awards table lives on the home page, not here", () => {
  assert.doesNotMatch(html, /<caption/);
  assert.doesNotMatch(html, /id="awards"/);
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
});

test("on-this-page entries resolve to real heading ids", () => {
  for (const item of page.onThisPage) {
    assert.ok(html.includes(`id="${slugify(item)}"`), `no heading for onThisPage entry ${item}`);
  }
});

test("group labels are the capitalized display form, not the slugs", () => {
  assert.equal(GROUP_LABELS["ai-ml"], "AI and ML");
  assert.doesNotMatch(html, />ai-ml</);
});

test("team projects carry the honesty rule before any credit", () => {
  const rule = html.indexOf("only claim the parts I can name");
  const firstTeam = html.indexOf("Auralis");
  assert.ok(rule !== -1 && rule < firstTeam, "the honesty rule must precede team credits");
});
