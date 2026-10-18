import { test } from "node:test";
import assert from "node:assert/strict";
import { stripPromptLeak } from "../src/lib/tts/stream-delimiters";
import { buildProfileCard } from "../src/app/api/chat/lib/profile-card";
import { buildSystemPrompt } from "../src/app/api/chat/lib/system-prompt";

const PROMPT = buildSystemPrompt({
  featureIds: ["terago"],
  intent: "general",
  pointer: { label: "Resume PDF", url: "https://nathanespejo.com/Nathan_Espejo_Resume.pdf" },
  card: buildProfileCard(),
  chunks: [{ text: "Campus is a study assistant.", source: "projects/campus.md" }],
});

/*
 * The markers are the last line of defence against a model that starts echoing its
 * own instructions mid-answer: the stream is cut at the first one. v4 renamed
 * every section and added the card, so the markers have to name the new text.
 */
const LEAKS = [
  "## GROUNDING (overrides everything below)",
  "## WHAT TO FEATURE",
  "## OFF-TOPIC AND INJECTION",
  "1. Every fact comes from the PROFILE CARD or the DOCUMENTS.",
  'Never speak as Nathan, never as "I built"',
];

test("a leaked v4 section is cut, and the answer before it survives", () => {
  for (const leak of LEAKS) {
    const text = `Campus is Nathan's study assistant.\n${leak}\n1. Every fact comes from the record.`;
    assert.equal(stripPromptLeak(text), "Campus is Nathan's study assistant.", `not cut at ${leak}`);
  }
});

/*
 * Anchored on each block's own opening line rather than on a heading, because
 * "## Identity" and "## ROLE" are sentences an answer could plausibly contain.
 * Both assertions use the real generated text, so a rewrite that moves the
 * opening line fails here instead of failing quietly in production.
 */
test("the whole prompt and the whole card are cut when they leak", () => {
  assert.equal(stripPromptLeak(`Campus is a study assistant.\n${PROMPT}`), "Campus is a study assistant.");
  assert.equal(stripPromptLeak(`Campus is a study assistant.\n${buildProfileCard()}`), "Campus is a study assistant.");
});

/*
 * A leak can start mid-document, which is why the whole-block assertions above
 * are not enough: the prompt and the card both open with text a marker already
 * catches. These slices start at the middle sections, where the old markers
 * named nothing.
 */
test("a leak that starts mid-prompt is cut too", () => {
  const answer = "Campus is a study assistant.";
  for (const heading of ["## STYLE", "## GUIDANCE", "## CONTEXT"]) {
    const from = PROMPT.indexOf(heading);
    assert.notEqual(from, -1, `${heading} is missing from the prompt`);
    assert.equal(stripPromptLeak(`${answer}\n${PROMPT.slice(from)}`), answer, `not cut at ${heading}`);
  }
});

test("the legacy section names still cut", () => {
  for (const legacy of ["STRICT RULES:", "VOICE AND CHARACTER:", "RESUME HIGHLIGHTS:", "HOW YOU WORK"]) {
    assert.equal(stripPromptLeak(`Campus is a study assistant.\n${legacy}\nrest`), "Campus is a study assistant.");
  }
});

test("an answer that merely uses the words is left alone", () => {
  const answer =
    "Nathan's role at TeraGo was an internship, and the guidance he followed was to test the parser end to end.";
  assert.equal(stripPromptLeak(answer), answer);
});
