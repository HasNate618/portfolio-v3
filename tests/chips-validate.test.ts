import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chipSubjectIds,
  repairChip,
  validateChip,
  type ChipSlotName,
} from "../src/app/api/chat/lib/chips-validate";
import { BANNED_WORD_PATTERNS } from "../src/lib/banned-words";

/** A chip that passes, so each test varies one thing. */
const base = {
  question: "How does Nathan's Campus retrieve answers?",
  subject: "campus",
  slot: "deeper" as ChipSlotName,
  answerSubject: "campus",
  asked: [] as string[],
  userAskedAbandoned: false,
};

function codes(over: Partial<typeof base>): string[] {
  return validateChip({ ...base, ...over }).map((failure) => failure.code);
}

test("a well-formed chip passes", () => {
  assert.deepEqual(validateChip(base), []);
});

test("a chip says Nathan", () => {
  assert.ok(codes({ question: "How does Campus retrieve answers?" }).includes("nathan"));
});

test("a chip does not use a pronoun", () => {
  assert.ok(codes({ question: "How does Nathan's Campus read his notes?" }).includes("pronoun"));
});

test("a chip stays short and asks a question", () => {
  assert.ok(
    codes({
      question:
        "How does Nathan's Campus retrieve answers from the six Brightspace course pages into SQLite and test a draft?",
    }).includes("length"),
  );
  assert.ok(codes({ question: "How does Nathan's Campus retrieve answers" }).includes("length"));
});

test("a chip carries no banned word", () => {
  // Interpolated rather than written out: check:words scans this file, and the
  // only place the word may appear is the list that bans it.
  const word = BANNED_WORD_PATTERNS[0].word;
  assert.ok(codes({ question: `Is Nathan's Campus ${word}?` }).includes("banned"));
});

test("a chip names a subject the card holds", () => {
  assert.ok(codes({ subject: "not-a-project" }).includes("subject"));
});

test("a chip names one thing, and it is the subject", () => {
  assert.ok(codes({ question: "How does Nathan's Campus compare with TeraGo?" }).includes("names"));
  assert.ok(codes({ question: "How does Nathan's Campus work?", subject: "aware" }).includes("names"));
});

/*
 * The organisation name ends in a period, so a trailing \b can never match it and
 * the chip would look like it named nothing at all.
 */
test("a name that ends in a period is still a name", () => {
  assert.ok(
    codes({ question: "Did Nathan work at Microcomputer Consulting Inc.?", subject: "aware" }).includes("names"),
  );
});

test("a subject of nathan may name a project", () => {
  assert.deepEqual(
    validateChip({ ...base, question: "What did Nathan build at TeraGo?", subject: "nathan", answerSubject: "nathan" }),
    [],
  );
});

test("the adjacent chip is about something else", () => {
  assert.ok(codes({ slot: "adjacent" }).includes("adjacent"));
  assert.deepEqual(
    validateChip({ ...base, slot: "adjacent", subject: "terago", question: "What did Nathan build at TeraGo?" }),
    [],
  );
});

test("an award premise needs an award on the record", () => {
  assert.ok(codes({ question: "What award did Nathan's AWARE win?", subject: "aware" }).includes("award"));
  assert.deepEqual(
    validateChip({ ...base, question: "What award did Nathan win for CareBridge?", subject: "carebridge" }),
    [],
  );
});

test("a solo premise needs a solo project", () => {
  assert.ok(codes({ question: "How does Nathan's solo CareBridge work?", subject: "carebridge" }).includes("solo"));
  assert.deepEqual(validateChip({ ...base, question: "How does Nathan's solo Campus work?" }), []);
});

test("a leadership premise needs a recorded role", () => {
  assert.ok(codes({ question: "What did Nathan lead at CareBridge?", subject: "carebridge" }).includes("led"));
  assert.deepEqual(
    validateChip({ ...base, question: "What did Nathan lead at 3D Western?", subject: "3d-western", answerSubject: "3d-western" }),
    [],
  );
});

test("a chip does not repeat a question the thread asked", () => {
  assert.ok(codes({ asked: ["how DOES nathan's campus retrieve answers?"] }).includes("dup"));
});

test("repair turns a pronoun into Nathan and leaves this alone", () => {
  assert.equal(repairChip("How does his Campus retrieve?"), "How does Nathan's Campus retrieve?");
  assert.equal(repairChip("Where did he intern?"), "Where did Nathan intern?");
  assert.equal(repairChip("Does Nathan keep this in SQLite?"), "Does Nathan keep this in SQLite?");
});

test("a repaired chip passes", () => {
  assert.deepEqual(validateChip({ ...base, question: repairChip("How does his Campus retrieve?") }), []);
});

test("an abandoned subject needs the visitor to have asked about it", () => {
  assert.ok(codes({ question: "How does Nathan's AgntOS work?", subject: "agntos" }).includes("subject"));
  assert.deepEqual(
    validateChip({ ...base, question: "How does Nathan's AgntOS work?", subject: "agntos", userAskedAbandoned: true }),
    [],
  );
});

test("subjects are the live projects, the roles and Nathan", () => {
  const ids = chipSubjectIds();
  assert.ok(ids.includes("campus"));
  assert.ok(ids.includes("terago"));
  assert.ok(ids.includes("nathan"));
  assert.ok(!ids.includes("agntos"));
  assert.ok(!ids.includes("cyberdeck"));
});
