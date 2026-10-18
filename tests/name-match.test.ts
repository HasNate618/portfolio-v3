import { test } from "node:test";
import assert from "node:assert/strict";
import { namePattern, namedSubjectId, namedSubjects } from "../src/app/api/chat/lib/name-match";

/*
 * One matcher for "does this text name that subject?", because it had been
 * written three times: chips-validate, topic.ts and context.ts. Two of the three
 * copies still had the bugs the first one had been fixed for.
 */

test("a dashed corpus path names the project it belongs to", () => {
  assert.deepEqual(namedSubjects("experience/3d-western.md"), ["3d-western"]);
  assert.deepEqual(namedSubjects("projects/gaming-mental-health-analyzer.md"), ["gaming-mental-health-analyzer"]);
});

test("a dashed id typed by a visitor names its subject", () => {
  assert.equal(namedSubjectId("tell me about 3d-western"), "3d-western");
  assert.equal(namedSubjectId("Tell me about 3D Western"), "3d-western");
});

/*
 * The validator's case-insensitive direction is safe, because a rejected chip
 * becomes a template. Here the answer is used, so the English word "aware" must
 * not be read as the project.
 */
test("a name written in capitals must be spelled in capitals", () => {
  assert.equal(namedSubjectId("Tell me about AWARE"), "aware");
  assert.equal(namedSubjectId("Is Nathan aware of the deadline?"), null);
  assert.deepEqual(namedSubjects("Is Nathan aware of the deadline?"), []);
});

test("a name ending in a period still matches", () => {
  assert.match("Microcomputer Consulting Inc. was his internship", namePattern("Microcomputer Consulting Inc."));
  assert.deepEqual(namedSubjects("Microcomputer Consulting Inc."), ["mcc"]);
});

test("a question that names nothing names nothing", () => {
  assert.equal(namedSubjectId("What does Nathan build?"), null);
  assert.deepEqual(namedSubjects("What does Nathan build?"), []);
});
