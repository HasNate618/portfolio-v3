import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { site, getProject } from "../src/data/site";

const HEADLINE =
  "Software engineer building full-stack apps, Linux infrastructure, hardware and AI systems. Software Engineering at Western, graduating May 2028.";

test("the headline names Linux and the graduation date, everywhere it is quoted", () => {
  assert.equal(site.identity.headline, HEADLINE);
  for (const file of ["src/app/layout.tsx", "src/components/SeoJsonLd.tsx", "content/home.md", "content/about.md"]) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /lately (mostly )?LLM tooling\.?"?$/m, `${file} still quotes the old headline`);
    assert.match(text, /full-stack apps, Linux infrastructure, hardware and AI systems/, `${file} misses the new headline`);
  }
});

test("Campus says what the drafts are checked against, in plain words, on the site and the resume", () => {
  const files = ["src/data/site.ts", "content/projects/campus.md", "content/resume.md", "resume/Resume.tex"];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /against (the )?(assignment )?briefs?\b/, `${file} still says "against the brief"`);
    assert.match(text, /assignment drafts against the instructions/, `${file} misses the new wording`);
  }
  assert.doesNotMatch(fs.readFileSync("src/data/site.ts", "utf8"), /study assistant/i);
});

test("the AWARE card line names the on-device models and says no cloud inference", () => {
  const line = getProject("aware")!.cardLine!;
  for (const model of ["YOLOv8n", "YAMNet", "MiniCPM", "Piper"]) {
    assert.ok(line.includes(model), `missing ${model}`);
  }
  assert.match(line, /no cloud inference/);
  assert.doesNotMatch(line, /offline/i);
  assert.doesNotMatch(line, /\$\d|\d{2,}/, "no big numbers on the card");
});

test("CareBridge leads with its pitch slide", () => {
  assert.equal(getProject("carebridge")!.media![0].alt, "CareBridge Pitch Slide");
});

test("AWARE names only the models its code loads", () => {
  const aware = getProject("aware")!;
  assert.deepEqual(aware.models!.map((m) => m.name.split(" ")[0]), ["YOLOv8n", "YAMNet", "Piper", "MiniCPM5-1B"]);
  const removed = /Whisper|BlazeFace|MediaPipe|MiDaS|Depth-Anything|Edge Impulse/i;
  for (const text of [aware.covers, aware.cardLine ?? "", aware.stack.join(" "), fs.readFileSync("content/projects/aware.md", "utf8")]) {
    assert.doesNotMatch(text, removed);
  }
  const local = fs.readFileSync("content/local-ai.md", "utf8").split("\n").find((l) => l.startsWith("| AWARE")) ?? "";
  assert.doesNotMatch(local, removed);
  assert.doesNotMatch(fs.readFileSync("content/skills.md", "utf8"), /MediaPipe\*\*: \[AWARE\]/);
});

test("every card leads with a demo or screenshot, except where only a title image exists", () => {
  // Campus media is on hold; CareBridge leads with its pitch slide by request;
  // AgntOS has only a banner.
  const exempt = new Set(["campus", "carebridge", "agntos"]);
  for (const p of site.projects) {
    if (exempt.has(p.id) || !p.media?.length) continue;
    assert.doesNotMatch(p.media[0].alt, /title card|wordmark|logo|banner|project overview|^\w+ overview$/i, `${p.id} leads with ${p.media[0].alt}`);
  }
  assert.equal(getProject("campus")!.media![0].src, "/projects/campus-0.svg", "Campus media stays as it is");
});

test("Omni-Reality stays plainly a team project, with no claim about which part is his", () => {
  const p = getProject("omni-reality")!;
  assert.equal(p.displayRole, "team project");
  assert.equal(p.score?.ownership, 0);
  const md = fs.readFileSync("content/projects/omni-reality.md", "utf8");
  for (const text of [p.covers, md]) {
    assert.doesNotMatch(text, /post-event|after the (event|hackathon)|is mine|my repo|kept (going|building)/i);
  }
});

test("Street Cleaner is solo everywhere it is listed", () => {
  assert.equal(getProject("street-cleaner")!.displayRole, "solo");
  assert.equal(getProject("street-cleaner")!.score?.ownership, 1);
  assert.equal(site.awards.find((a) => a.project === "Street Cleaner")?.role, "Solo");
  assert.match(fs.readFileSync("content/awards.md", "utf8"), /\| Second Award \| Solo \|/);
});

test("CareBridge copy: keyword-only risk flags and the storm as the hackathon's case", () => {
  const md = fs.readFileSync("content/projects/carebridge.md", "utf8");
  assert.doesNotMatch(md, /combine keyword rules with model output/);
  assert.match(md, /risk flags come from keyword rules/);
  assert.match(md, /made-up case/);
});

test("ferret and Glyph claim no current use or need", () => {
  assert.match(fs.readFileSync("content/projects/ferret.md", "utf8"), /not because I needed it, and I don't use it/);
  assert.match(fs.readFileSync("content/projects/glyph.md", "utf8"), /I used it while I was on Windows\./);
});

test("WebSockets is credited to Omni-Reality only, not AWARE", () => {
  const line = fs.readFileSync("content/skills.md", "utf8").split("\n").find((l) => l.includes("**WebSockets**"))!;
  assert.match(line, /Omni-Reality/);
  assert.doesNotMatch(line, /AWARE/);
});
