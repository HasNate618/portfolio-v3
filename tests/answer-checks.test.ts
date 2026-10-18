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

/*
 * The whitelist holds the address twice, once as a mailto and once bare, so a mailto in the
 * text must not read as two different URLs: that would report an answer as having invented a
 * link it did not invent.
 */
test("a mailto and the bare address are the same URL", () => {
  const out = check("Reach him at mailto:nate.e.espejo@gmail.com.", {
    whitelist: [...WHITELIST, "mailto:nate.e.espejo@gmail.com", "nate.e.espejo@gmail.com"],
  });
  assert.deepEqual(out.urlsMissing, []);
});

test("a URL that ends a sentence is not missing over the period", () => {
  assert.deepEqual(check(`His resume is at ${RESUME}.`).urlsMissing, []);
});

test("an answer with no numbers or URLs reports nothing", () => {
  const out = check("Nathan built Campus with his team.");
  assert.deepEqual(out, { numbersMissing: [], urlsMissing: [] });
});
