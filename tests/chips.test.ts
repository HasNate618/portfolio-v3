import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTION_BANK } from "../src/data/question-bank";
import { selectChips, CHIP_SIMILARITY_THRESHOLD } from "../src/app/api/chat/lib/chips";

const bankQuestions = new Set(QUESTION_BANK.map((entry) => entry.question));

test("threshold is pinned", () => {
  assert.equal(CHIP_SIMILARITY_THRESHOLD, 0.35);
});

test("returns three bank questions", () => {
  const vector = new Array(1024).fill(0.1);
  const chips = selectChips({ queryVector: vector, question: "What does Nathan build?", asked: [] });
  assert.equal(chips.length, 3);
  for (const chip of chips) {
    assert.ok(bankQuestions.has(chip), `${chip} is not a bank question`);
  }
});

test("one chip per stage", () => {
  const vector = new Array(1024).fill(0.1);
  const chips = selectChips({ queryVector: vector, question: "What does Nathan build?", asked: [] });
  const stages = chips.map((chip) => QUESTION_BANK.find((entry) => entry.question === chip)!.stage);
  assert.equal(new Set(stages).size, stages.length, "duplicate stage in chips");
});

test("does not repeat asked questions", () => {
  const vector = new Array(1024).fill(0.1);
  const asked = ["What does Nathan build?"];
  const chips = selectChips({ queryVector: vector, question: "What is Nathan's Campus project?", asked });
  assert.ok(!chips.includes("What does Nathan build?"));
  assert.ok(!chips.includes("What is Nathan's Campus project?"));
});

test("threshold fallback returns bank questions", () => {
  const zero = new Array(1024).fill(0);
  const chips = selectChips({ queryVector: zero, question: "What does Nathan build?", asked: [] });
  assert.equal(chips.length, 3);
  for (const chip of chips) {
    assert.ok(bankQuestions.has(chip), `${chip} is not a bank question`);
  }
});
