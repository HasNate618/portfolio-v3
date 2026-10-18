import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FOLLOWUPS,
  STARTERS,
  isNonAnswer,
} from "../src/app/api/chat/lib/followup-fallback";
import { buildChipPrompt, formatFollowupsTail } from "../src/app/api/chat/lib/generate-followups";

const CHIP_INPUT = {
  userMessage: "what is ferret?",
  answer: "ferret is a local-first search tool in Rust, with hybrid search over text, images and PDFs.",
  docs: [{ title: "ferret", firstLine: "Local-first semantic search in Rust." }],
  featureIds: ["campus", "terago", "aware"],
  asked: [] as string[],
  userAskedAbandoned: false,
};

test("the client tail keeps the shape the page parses", () => {
  assert.equal(formatFollowupsTail(["a?", "b?", "c?"]), "a?|||b?|||c?|||");
});

test("a fixed line is not treated as an answer", () => {
  assert.ok(isNonAnswer("I couldn't find that in Nathan's knowledgebase. Try asking about a project or role."));
  assert.ok(isNonAnswer("I couldn\u2019t find that in Nathan's knowledgebase."), "a typographic apostrophe still matches");
  assert.ok(isNonAnswer("That instruction does not apply. I speak for Nathan's record only."));
  assert.ok(isNonAnswer("I only answer questions about Nathan's work, projects and experience."));
  assert.ok(!isNonAnswer("Nathan built Channel Finder at TeraGo, validated on 760 test cases."));
});

test("the defaults are the page starters, so the two cannot drift", () => {
  assert.equal(DEFAULT_FOLLOWUPS.length, 3);
  assert.deepEqual(DEFAULT_FOLLOWUPS, STARTERS.slice(0, 3));
});

test("the chip prompt asks for the three slots by name", () => {
  const prompt = buildChipPrompt(CHIP_INPUT);
  assert.match(prompt, /deeper/);
  assert.match(prompt, /adjacent/);
  assert.match(prompt, /path/);
  assert.match(prompt, /"deeper"/);
});

test("the chip prompt carries the answer and the documents", () => {
  const prompt = buildChipPrompt(CHIP_INPUT);
  assert.match(prompt, /ferret is a local-first search tool/);
  assert.match(prompt, /Local-first semantic search in Rust/);
});

/*
 * An abandoned name in the prompt comes back as a chip about abandoned work, and
 * the chat then has to refuse the question it just suggested.
 */
test("the chip prompt names no abandoned project", () => {
  assert.doesNotMatch(buildChipPrompt(CHIP_INPUT), /AgntOS|Cyberdeck/);
});

/*
 * One bullet said "Refer to him in third person (he/his/Nathan)" while another
 * said every question "says Nathan". A live sample of 30 chips followed the
 * first: 13 said "Nathan", the rest used he or his.
 */
test("the chip prompt requires the word Nathan and shows what that means", () => {
  const prompt = buildChipPrompt(CHIP_INPUT);
  assert.doesNotMatch(prompt, /\(he\/his\/Nathan\)/);
  assert.match(prompt, /must contain the word "Nathan"/, "a naming preference is not enough: the model drops it");
  assert.match(prompt, /How does Nathan's outage-email parser work\?/, "the prompt shows the shape it wants");
  assert.match(prompt, /never "he", "his" or "him"/);
});

/*
 * Three chips answering the same question three ways was the live pattern. A
 * hiring reader gets more from one that goes deeper, one that points at related
 * work, and one that leads to contact.
 */
test("the chip prompt gives the three slots three jobs", () => {
  const prompt = buildChipPrompt(CHIP_INPUT);
  assert.match(prompt, /a detail the answer raised but did not explain/);
  assert.match(prompt, /a different project or role/);
  assert.match(prompt, /the next hiring step/);
});

test("the chip prompt carries what the card can be asked about", () => {
  const prompt = buildChipPrompt(CHIP_INPUT);
  assert.match(prompt, /campus: Campus \(solo, no award\)/);
  assert.match(prompt, /carebridge: CareBridge \(team, his part is not on record/);
  assert.match(prompt, /terago: TeraGo \(role: /);
});

test("a regenerate prompt lists what was wrong with the first attempt", () => {
  const prompt = buildChipPrompt(CHIP_INPUT, [
    { code: "award", slot: "adjacent" },
    { code: "dup", slot: "path" },
  ]);
  assert.match(prompt, /adjacent: award/);
  assert.match(prompt, /path: dup/);
});
