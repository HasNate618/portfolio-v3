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

test("skills use the resume's six groups, Languages first", () => {
  const groups = ["Languages", "AI/ML", "Web &amp; Data", "Infra", "Hardware &amp; 3D", "Games &amp; AR/VR"];
  for (const group of groups) {
    assert.ok(html.includes(group), `missing ${group}`);
  }
  assert.deepEqual(page.skills?.map((g) => g.group), ["Languages", "AI/ML", "Web & Data", "Infra", "Hardware & 3D", "Games & AR/VR"]);
});

test("the skills list names tools only through the projects that used them", () => {
  const items = (page.skills ?? []).flatMap((g) => g.items);
  assert.ok(!items.includes("Hermes Agent"), "Hermes Agent is a tool he runs, not a skill line");
  for (const skill of ["Unity", "Arduino", "ESP32", "BLE", "Onshape", "Kotlin (Android)", "C#/.NET"]) {
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

test("Unity stands alone and AR/VR names the headset and SDKs", () => {
  const group = (name: string) => page.skills?.find((g) => g.group === name)?.items ?? [];
  const items = (page.skills ?? []).flatMap((g) => g.items);
  assert.ok(!items.includes("Unity (XR)"), "Unity is a game engine skill, not an XR qualifier");
  assert.ok(group("Games & AR/VR").includes("Unity"));
  assert.ok(group("Games & AR/VR").includes("Meta Quest (Meta XR SDK, XR Interaction Toolkit, OpenXR)"), "the SDK list must stay one item");
  assert.ok(group("Infra")[0] === "Linux", "Linux leads the Infra line");
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

test("each job's bullets sit under that job's own heading, matched by name", () => {
  const section = html.slice(html.indexOf('id="experience"'), html.indexOf('id="projects"'));
  const terago = section.indexOf("· TeraGo</h3>");
  const western = section.indexOf("· 3D Western</h3>");
  assert.ok(terago !== -1 && western !== -1, "both role headings render");
  const blockFor = (start: number) => {
    const next = [terago, western].filter((p) => p > start).sort((a, b) => a - b)[0];
    return section.slice(start, next ?? section.length);
  };
  assert.match(blockFor(terago), /prototype pipeline/);
  assert.doesNotMatch(blockFor(terago), /print-safety/);
  assert.match(blockFor(western), /print-safety/);
  assert.doesNotMatch(blockFor(western), /prototype pipeline/);
});

test("each resume project gets the content subsection with its own name", () => {
  for (const project of site.projects.filter((p) => p.onResume)) {
    const start = html.indexOf(`>${project.name}</h3>`);
    assert.ok(start !== -1, `missing ${project.name}`);
  }
  const homelab = html.slice(html.indexOf(">NixOS homelab</h3>"), html.indexOf(">AWARE</h3>"));
  assert.match(homelab, /sops-nix/);
  assert.doesNotMatch(homelab, /YOLOv8/);
});

test("the web resume mirrors the PDF: no stack chips, and each role title appears once", () => {
  assert.doesNotMatch(html, /rounded-full bg-accent\/10 px-3 py-1/, "no stack chips on /resume");
  for (const role of site.experience.filter((e) => e.onResume)) {
    const count = html.split(role.role).length - 1;
    assert.equal(count, 1, `the ${role.org} role title shows ${count} times`);
  }
});
