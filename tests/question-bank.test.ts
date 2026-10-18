import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { QUESTION_BANK } from "../src/data/question-bank";
import { STARTERS } from "../src/app/api/chat/lib/followup-fallback";
import { getCorpusDocs } from "../src/lib/corpus";
import { site } from "../src/data/site";

const docs = getCorpusDocs();
const docByPath = new Map(docs.map((doc) => [doc.path, doc.text]));
const corpusTextFor = (sources: string[]) =>
  sources.map((source) => docByPath.get(source) ?? "").join("\n");

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("question bank has the target size", () => {
  assert.ok(QUESTION_BANK.length >= 55, `expected at least 55 entries, got ${QUESTION_BANK.length}`);
  assert.ok(QUESTION_BANK.length <= 65, `expected at most 65 entries, got ${QUESTION_BANK.length}`);
});

test("question bank ids are unique", () => {
  const ids = QUESTION_BANK.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate question bank id");
});

test("every question is well-formed", () => {
  const entityGroups = [
    ...site.projects.map((project) => [project.name, project.id]),
    ...site.experience.map((experience) => [experience.org, experience.id]),
  ];

  for (const entry of QUESTION_BANK) {
    assert.ok(entry.question.includes("Nathan"), `${entry.id} does not contain Nathan`);
    assert.ok(entry.question.endsWith("?"), `${entry.id} does not end with ?`);
    assert.ok(entry.question.length < 90, `${entry.id} is 90 characters or longer`);

    const namedEntities = entityGroups.filter((variants) =>
      variants.some((variant) => new RegExp(`\\b${escapeRegExp(variant)}\\b`, "i").test(entry.question))
    );
    assert.ok(
      namedEntities.length <= 1,
      `${entry.id} names ${namedEntities.length} entities`
    );
  }
});

test("no entry is about an abandoned project", () => {
  const abandoned = site.projects
    .filter((project) => project.displayStatus === "abandoned")
    .flatMap((project) => [project.name, project.id]);

  for (const entry of QUESTION_BANK) {
    const haystack = [entry.id, entry.question, entry.subject ?? "", ...entry.answerMustContain].join("\n");
    for (const name of abandoned) {
      assert.ok(
        !new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(haystack),
        `${entry.id} references abandoned project ${name}`
      );
    }
  }
});

test("every source exists and every answer substring is grounded", () => {
  for (const entry of QUESTION_BANK) {
    for (const source of entry.sources) {
      assert.ok(docByPath.has(source), `${entry.id} has unknown source ${source}`);
    }

    const text = corpusTextFor(entry.sources);
    for (const required of entry.answerMustContain) {
      assert.ok(
        text.includes(required),
        `${entry.id} is missing required substring: ${required}`
      );
    }
  }
});

test("every stage has at least three entries", () => {
  const counts = new Map<string, number>();
  for (const entry of QUESTION_BANK) {
    counts.set(entry.stage, (counts.get(entry.stage) ?? 0) + 1);
  }
  for (const stage of ["builds", "proof", "availability", "contact"]) {
    assert.ok((counts.get(stage) ?? 0) >= 3, `${stage} has fewer than 3 entries`);
  }
});

test("starter questions match content/chat.md", () => {
  const chat = fs.readFileSync("content/chat.md", "utf8");
  const match = chat.match(/^starters:\s*\[(.*)\]$/m);
  assert.ok(match, "content/chat.md has no starters list");
  const starters = match[1].split(",").map((value) => value.trim()).filter(Boolean);

  // The bank's own starter rows are no longer the source of truth: the four
  // lines now live in STARTERS, which the fallback list is cut from.
  assert.equal(STARTERS.length, starters.length, "starter count mismatch");
  assert.deepEqual(new Set(STARTERS), new Set(starters), "starter questions mismatch");
  assert.ok(QUESTION_BANK.some((entry) => entry.starter), "the bank still carries starters until it is removed");
});

/*
 * "What did Nathan win at Hack the North 2025?" sat in the bank with awards.md as
 * its source. Hack the North is not in his awards at all; the entry survived
 * because the test only checked substrings, and the entity check only knew names
 * that appear in site.ts. Every proper noun in a question has to be in its own
 * sources.
 */
test("every proper noun in a question appears in that entry's sources", () => {
  const stoplist = new Set([
    "What", "What's", "How", "Which", "Is", "Did", "Does", "Do", "When", "Where",
    "Why", "Who", "Tell", "Can", "Was", "Were", "The", "A", "An", "Nathan",
  ]);

  for (const entry of QUESTION_BANK) {
    const text = corpusTextFor(entry.sources);
    const properNouns = (entry.question.match(/\b[A-Z][A-Za-z0-9-]*\b/g) ?? []).filter(
      (word) => !stoplist.has(word),
    );

    for (const noun of properNouns) {
      assert.ok(
        text.includes(noun),
        `${entry.id}: "${noun}" appears in the question but not in ${entry.sources.join(", ")}`,
      );
    }
  }
});

/*
 * One required string is too easy to satisfy: delete it and the assertion goes
 * with it. Two is the floor that makes the test able to fail.
 */
test("every entry requires at least two grounded strings", () => {
  for (const entry of QUESTION_BANK) {
    assert.ok(
      entry.answerMustContain.length >= 2,
      `${entry.id} only requires ${entry.answerMustContain.length} string(s)`,
    );
  }
});

/*
 * The first bank was 41 builds and 7 proof: after an answer about Campus the
 * deeper chip was "What is Nathan's Campus project?", which repeats it. A chip
 * mix is the product surface, so the mix is a test.
 */
test("the stage mix favours proof over restating what a project is", () => {
  const count = (stage: string) => QUESTION_BANK.filter((entry) => entry.stage === stage).length;

  assert.ok(count("proof") >= 15, `proof has ${count("proof")} entries, want at least 15`);
  assert.ok(count("builds") <= 20, `builds has ${count("builds")} entries, want at most 20`);
  assert.ok(count("availability") <= 6, `availability has ${count("availability")}, and only one fact exists`);
  assert.ok(count("contact") >= 3, `contact has ${count("contact")} entries`);
});

/*
 * "Is CareBridge Nathan's own repository?" asserted ownership of a team project,
 * and a solo project must not be asked about "the team".
 */
test("no entry asserts a team or an ownership the record does not support", () => {
  for (const entry of QUESTION_BANK) {
    const subjectId = entry.subject;
    if (!subjectId) continue;
    const project = site.projects.find(
      (candidate) => candidate.id === subjectId || candidate.name === subjectId,
    );
    if (!project) continue;

    if (project.displayRole === "solo") {
      assert.doesNotMatch(entry.question, /\bteam\b/i, `${entry.id} asks about a team on a solo project`);
    }
    if (project.displayRole.includes("team")) {
      assert.doesNotMatch(entry.question, /\bown\b/i, `${entry.id} claims ownership of a team project`);
    }
  }
});
