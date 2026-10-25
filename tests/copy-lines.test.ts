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
