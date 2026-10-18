import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeView } from "../../src/components/views/ResumeView";
import { getPage } from "../../src/lib/content";
import { site } from "../../src/data/site";

const page = getPage("/resume")!;
const html = renderToStaticMarkup(<ResumeView page={page} />);

test("resume describes the outage parser honestly", () => {
  assert.match(html, /outage ticketing/);
  assert.match(html, /Jira/);
  assert.match(html, /not yet deployed/);
  assert.doesNotMatch(html, /Automated/);
});

test("resume carries no phone number", () => {
  assert.doesNotMatch(html, /416-825-7510/);
  assert.doesNotMatch(html, /\b\d{3}-\d{3}-\d{4}\b/);
});

test("the PDF link precedes the body content", () => {
  assert.ok(html.indexOf("Nathan_Espejo_Resume.pdf") < html.indexOf("Education"));
});

test("skills use the resume's four groups", () => {
  for (const group of ["AI", "Languages", "Web &amp; Infra", "Tools"]) {
    assert.ok(html.includes(group), `missing ${group}`);
  }
});

test("the five sections appear in the PDF's order", () => {
  const order = ["Education", "Experience", "Projects", "Hackathon Awards", "Technical Skills"];
  const positions = order.map((heading) => html.indexOf(`id="${heading.toLowerCase().replace(/ /g, "-")}"`));
  assert.ok(positions.every((p) => p !== -1), "a section heading is missing");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "sections are out of order");
});

test("figures resolve from site.ts rather than the markdown", () => {
  for (const value of ["4,620", "411", "212", "760"]) {
    assert.ok(html.includes(value), `missing ${value}`);
  }
  for (const value of ["4,620", "411", "212", "760"]) {
    assert.ok(!page.body.includes(value), `${value} must not be typed into content`);
  }
});

test("only roles and projects flagged onResume are listed", () => {
  assert.equal(site.experience.filter((e) => e.onResume).length, 2);
  assert.equal(site.projects.filter((p) => p.onResume).length, 3);
  assert.doesNotMatch(html, /WEMars/);
  assert.doesNotMatch(html, /Microcomputer/);
});

test("no role or project stack list is restated in the content file", () => {
  assert.ok(!page.body.includes("FastAPI"), "the stack comes from site.ts via StackList");
});

test("the resume never says 'present'", () => {
  assert.doesNotMatch(html, /present/i);
});
