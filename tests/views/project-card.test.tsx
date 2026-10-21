import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectCard } from "../../src/components/ProjectCard";
import { getProject } from "../../src/data/site";

function project(id: string) {
  const found = getProject(id);
  assert.ok(found, `missing project ${id}`);
  return found;
}

function title(html: string) {
  return html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? "";
}

test("a card with a case study makes the title link the whole card to it", () => {
  const html = renderToStaticMarkup(<ProjectCard project={project("campus")} />);
  const heading = title(html);
  assert.match(heading, /href="\/projects\/campus"/);
  assert.match(heading, /after:absolute/);
  assert.match(heading, /after:inset-0/);
  assert.match(html, /<li[^>]*class="[^"]*relative[^"]*"/);
});

test("a card without a case study links to its first external link", () => {
  const html = renderToStaticMarkup(<ProjectCard project={project("carebridge")} />);
  const heading = title(html);
  assert.match(heading, /href="https:\/\/devpost\.com\/software\/care-bridge-ai"/);
  assert.match(heading, /target="_blank"/);
  assert.match(heading, /rel="noopener noreferrer"/);
  assert.match(heading, /after:absolute/);
});

test("a card with no links is not a link", () => {
  const html = renderToStaticMarkup(<ProjectCard project={project("motaru")} />);
  const heading = title(html);
  assert.doesNotMatch(heading, /<a/);
  assert.doesNotMatch(html, /after:absolute/);
});

test("the other card links sit above the stretched link", () => {
  const html = renderToStaticMarkup(<ProjectCard project={project("campus")} />);
  assert.match(html, /class="relative z-10 font-medium text-accent/);
  assert.match(
    html,
    /<a[^>]*href="https:\/\/github\.com\/HasNate618\/Campus"[^>]*target="_blank"/,
  );
  assert.match(
    html,
    /<a[^>]*href="https:\/\/github\.com\/HasNate618\/Campus"[^>]*rel="noopener noreferrer"/,
  );
  assert.match(html, /class="relative z-10 block cursor-zoom-in"/);
});
