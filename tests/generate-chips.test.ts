import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyChipPipeline,
  answerSubjectFor,
  CHIP_SCHEMA,
  type ChipInputs,
} from "../src/app/api/chat/lib/generate-followups";
import type { ChipSet } from "../src/app/api/chat/lib/chips-validate";

const INPUTS: ChipInputs = {
  answerSubject: "campus",
  featureIds: ["campus", "terago", "aware"],
  asked: [],
  userAskedAbandoned: false,
  pathIndex: 0,
};

const DOC_INPUT = {
  userMessage: "what is TeraGo?",
  answer: "Nathan interned at TeraGo in 2026.",
  docs: [{ title: "TeraGo", firstLine: "Software Engineering Intern." }],
  featureIds: ["campus", "terago", "aware"],
  asked: [] as string[],
  userAskedAbandoned: false,
};

function chipSet(over: Partial<ChipSet> = {}): ChipSet {
  return {
    deeper: { question: "How does Nathan's Campus retrieve answers?", subject: "campus" },
    adjacent: { question: "What did Nathan build at TeraGo?", subject: "terago" },
    path: { question: "Is Nathan available for a Summer 2027 internship?", subject: "nathan" },
    ...over,
  };
}

test("a chip set that passes is returned as written", () => {
  const raw = chipSet();
  const result = applyChipPipeline(raw, INPUTS);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.questions, [raw.deeper.question, raw.adjacent.question, raw.path.question]);
});

test("a rejected slot is repaired before it is replaced", () => {
  const result = applyChipPipeline(chipSet({ deeper: { question: "How does his Campus retrieve?", subject: "campus" } }), INPUTS);
  assert.equal(result.questions[0], "How does Nathan's Campus retrieve?");
});

test("a slot that still fails becomes a template, and says why", () => {
  const result = applyChipPipeline(
    chipSet({ deeper: { question: "What award did Nathan's AWARE win?", subject: "aware" } }),
    { ...INPUTS, answerSubject: "aware" },
  );
  assert.equal(result.questions[0], "How does Nathan's AWARE work?");
  assert.ok(result.failures.some((failure) => failure.code === "award"));
  assert.ok(result.failures.some((failure) => failure.slot === "deeper"));
});

test("the adjacent slot may not be about the deeper slot's subject", () => {
  const result = applyChipPipeline(
    chipSet({ adjacent: { question: "How does Nathan's Campus rank results?", subject: "campus" } }),
    INPUTS,
  );
  assert.ok(result.failures.some((failure) => failure.code === "adjacent"));
  assert.equal(result.questions[1], "What did Nathan build at TeraGo?");
});

test("one rejected slot does not throw away the two that passed", () => {
  const raw = chipSet({ path: { question: "Where is Nathan's résumé?", subject: "nathan" } });
  const result = applyChipPipeline(raw, { ...INPUTS, asked: ["Where is Nathan's résumé?"] });
  assert.equal(result.questions[0], raw.deeper.question);
  assert.equal(result.questions[1], raw.adjacent.question);
  assert.equal(result.questions[2], "Is Nathan available for a Summer 2027 internship?");
});

test("the answer subject comes from the documents first", () => {
  assert.equal(answerSubjectFor(DOC_INPUT), "terago");
  assert.equal(answerSubjectFor({ ...DOC_INPUT, docs: [] }), "campus");
  assert.equal(answerSubjectFor({ ...DOC_INPUT, docs: [], featureIds: [] }), "nathan");
});

/*
 * A document title is a corpus path, so the id arrives dashed while the display
 * name has a space where the dash is. Neither "3D Western" nor "3d western"
 * matched "experience/3d-western.md", so the subject fell back to the topic's
 * first feature and the chip prompt named the wrong project, silently.
 */
test("a dashed document title still names its subject", () => {
  const docs = [{ title: "experience/3d-western.md", firstLine: "VP of Data/ML" }];
  assert.equal(answerSubjectFor({ ...DOC_INPUT, docs }), "3d-western");
  assert.equal(
    answerSubjectFor({ ...DOC_INPUT, docs: [{ title: "projects/gaming-mental-health-analyzer.md", firstLine: "Analyzer" }] }),
    "gaming-mental-health-analyzer",
  );
});

test("the schema names the three slots and the subjects the model may use", () => {
  const schema = CHIP_SCHEMA as {
    properties: Record<string, { properties: { subject: { enum: string[] } } }>;
  };
  assert.deepEqual(Object.keys(schema.properties).sort(), ["adjacent", "deeper", "path"]);
  const subjects = schema.properties.deeper.properties.subject.enum;
  assert.ok(subjects.includes("campus"));
  assert.ok(subjects.includes("terago"));
  assert.ok(subjects.includes("nathan"));
  assert.ok(!subjects.includes("agntos"));
});
