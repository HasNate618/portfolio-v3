import { test } from "node:test";
import assert from "node:assert/strict";
import { answerChecks } from "../src/app/api/chat/lib/answer-checks";

const CARD = "Campus retrieval precision: 84.2% on 308 test cases, built in 2026.";
const RESUME = "https://www.nathanespejo.com/Nathan_Espejo_Resume.pdf";
const WHITELIST = [RESUME, "https://www.nathanespejo.com/projects/campus"];

const check = (text: string, overrides: Partial<Parameters<typeof answerChecks>[0]> = {}) =>
  answerChecks({ text, card: CARD, documents: [], whitelist: WHITELIST, ...overrides });

test("a number the card carries is not missing", () => {
  assert.deepEqual(check("Campus retrieval precision is 84.2% across 308 cases.").numbersMissing, []);
});

test("a number the record cannot back is reported", () => {
  assert.deepEqual(check("It passed 99.9% of its cases.").numbersMissing, ["99.9%"]);
});

test("a number in a retrieved document counts as backed", () => {
  const out = check("The build took 4711 seconds.", {
    documents: [{ snippet: "The build took 4711 seconds on the CI box." }],
  });
  assert.deepEqual(out.numbersMissing, []);
});

test("a URL outside the whitelist is reported", () => {
  const out = check("See https://github.com/someone/other for more.");
  assert.deepEqual(out.urlsMissing, ["https://github.com/someone/other"]);
});

test("a whitelisted URL is not reported", () => {
  const out = check(`His resume is at ${RESUME}.`);
  assert.deepEqual(out.urlsMissing, []);
});

test("the pointer is counted in the last paragraph", () => {
  const out = check(`Campus is a study assistant.\n\nHis resume is at ${RESUME}`);
  assert.equal(out.pointerUrls, 1);
});

test("a URL repeated mid-answer is not a pointer", () => {
  const out = check(`${RESUME} is the link.\n\nCampus is a study assistant.`);
  assert.equal(out.pointerUrls, 0);
});

test("an answer with no numbers or URLs reports nothing", () => {
  const out = check("Nathan built Campus with his team.");
  assert.deepEqual(out, { numbersMissing: [], urlsMissing: [], pointerUrls: 0 });
});
