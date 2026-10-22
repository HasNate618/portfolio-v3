import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeView } from "../../src/components/views/ResumeView";
import { getPage } from "../../src/lib/content";
import { site } from "../../src/data/site";

const page = getPage("/resume")!;
const html = renderToStaticMarkup(<ResumeView page={page} />);

test("resume describes the email prototype honestly", () => {
  assert.match(html, /prototype pipeline/);
  assert.match(html, /structured tickets/);
  assert.match(html, /working end to end/);
  assert.doesNotMatch(html, /Automated/);
});

test("resume carries no phone number", () => {
  assert.doesNotMatch(html, /416-825-7510/);
  assert.doesNotMatch(html, /\b\d{3}-\d{3}-\d{4}\b/);
});

test("the PDF link precedes the body content", () => {
  assert.ok(html.indexOf("Nathan_Espejo_Resume.pdf") < html.indexOf("Education"));
});

test("skills use the resume's five groups, Languages first", () => {
  const groups = ["Languages", "AI/ML", "Web &amp; Data", "Infra", "Hardware &amp; 3D"];
  for (const group of groups) {
    assert.ok(html.includes(group), `missing ${group}`);
  }
  assert.deepEqual(page.skills?.map((g) => g.group), ["Languages", "AI/ML", "Web & Data", "Infra", "Hardware & 3D"]);
});

test("the skills list names tools only through the projects that used them", () => {
  const items = (page.skills ?? []).flatMap((g) => g.items);
  assert.ok(!items.includes("Hermes Agent"), "Hermes Agent is a tool he runs, not a skill line");
  for (const skill of ["Unity (XR)", "Arduino", "ESP32", "Onshape", "Kotlin"]) {
    assert.ok(items.includes(skill), `missing ${skill}`);
  }
});

test("coursework skills land on the right lines and AWS stays one item", () => {
  const group = (name: string) => page.skills?.find((g) => g.group === name)?.items ?? [];
  assert.ok(group("Infra").includes("AWS (EC2, S3)"), "AWS (EC2, S3) should be a single Infra item");
  assert.ok(!group("Infra").includes("S3)"), "the comma inside AWS (EC2, S3) must not split the item");
  assert.ok(group("Infra").includes("Jira") && group("Infra").includes("Confluence"));
  assert.ok(group("Web & Data").includes("MySQL"));
});

test("the five sections appear in the PDF's order", () => {
  const order = ["Education", "Experience", "Projects", "Hackathon Awards", "Technical Skills"];
  const positions = order.map((heading) => html.indexOf(`id="${heading.toLowerCase().replace(/ /g, "-")}"`));
  assert.ok(positions.every((p) => p !== -1), "a section heading is missing");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "sections are out of order");
});

test("figures resolve from site.ts rather than the markdown", () => {
  for (const value of ["4,620", "403"]) {
    assert.ok(html.includes(value), `missing ${value}`);
  }
  for (const value of ["4,620", "403"]) {
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

test("Jira is never credited to 3D Western, which used a GitHub project board", async () => {
  const fs = await import("node:fs");
  for (const file of ["content/experience/3d-western.md", "content/experience.md", "resume/Resume.tex"]) {
    const text = fs.readFileSync(file, "utf8");
    const block = file.endsWith(".md") && file.includes("3d-western") ? text : (text.split(/3D Western/)[1] ?? "").split(/\n\s*(?:###|\\resumeSubheading)/)[0];
    assert.doesNotMatch(block, /Jira/i, `${file} ties Jira to 3D Western`);
  }
});
