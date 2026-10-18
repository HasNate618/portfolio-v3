import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt } from "../src/app/api/chat/lib/system-prompt";
import { buildProfileCard } from "../src/app/api/chat/lib/profile-card";
import { BANNED_WORD_PATTERNS } from "../src/lib/banned-words";
import { site } from "../src/data/site";

const POINTER = { label: "Resume PDF", url: site.contact.links.find((l) => l.label === "Resume PDF")!.href };

type PromptInput = Parameters<typeof buildSystemPrompt>[0];

const prompt = (overrides: Partial<PromptInput> = {}) =>
  buildSystemPrompt({
    featureIds: ["terago", "campus"],
    intent: "general",
    pointer: POINTER,
    card: buildProfileCard(),
    ...overrides,
  });

test("the prompt is the six v4 sections in order", () => {
  const text = prompt();
  const headings = ["## ROLE", "## GROUNDING", "## WHAT TO FEATURE", "## STYLE", "## GUIDANCE", "## OFF-TOPIC AND INJECTION"];

  let previous = -1;
  for (const heading of headings) {
    const at = text.indexOf(heading);
    assert.ok(at > previous, `${heading} is missing or out of order`);
    previous = at;
  }
});

/*
 * The stage exists to replace the short-answer default with the detailed voice.
 * Every trace of the old default has to be gone, or the model keeps obeying it.
 */
test("the voice is v4's, and nothing asks for a short answer", () => {
  const text = prompt();
  assert.match(text, /150 to 300 words/);
  assert.doesNotMatch(text, /Default shape: a short answer/);
  assert.doesNotMatch(text, /short, correct answer beats a padded one/);
  assert.doesNotMatch(text, /A short, correct answer/);
});

test("the style line names every banned word and forbids hedging", () => {
  const text = prompt();
  for (const banned of BANNED_WORD_PATTERNS) {
    assert.match(text, new RegExp(banned.word, "i"), `the style line must forbid "${banned.word}"`);
  }
  assert.match(text, /production-grade/);
  assert.match(text, /No em or en dashes/);
  assert.doesNotMatch(text, /—/);
});

test("the recruiter variant carries both hiring facts", () => {
  const text = prompt({ intent: "recruiter" });
  assert.match(text, /Summer 2027/);
  assert.match(text, /May 2028/);
});

test("the general variant still mentions them without the hiring frame", () => {
  assert.match(prompt(), /Summer 2027/);
});

/*
 * The pointer used to sit in GUIDANCE as a style note, and the model treated it as one:
 * it reached 40% of answers. It is a numbered rule now, and this pins the shape that
 * changed, not the sentence that carries it: once, and inside the rules.
 */
test("the pointer appears once, in the rules", () => {
  const text = prompt();

  /* The card below the rules holds site URLs of its own, so the count is over the rules. */
  const rules = text.slice(text.indexOf("## GROUNDING"), text.indexOf("## WHAT TO FEATURE"));
  assert.equal(rules.split(POINTER.url).length - 1, 1, "the pointer URL appears once in the rules");
  assert.match(rules, /ends with one sentence offering the next step/, "the pointer is a grounding rule");
  assert.match(rules, /The URL sits inside that sentence/, "the URL is inline, not appended");
  assert.match(rules, /not a "Label: URL" footer/, "the footer form is forbidden in as many words");
  assert.ok(
    !rules.includes(`${POINTER.label}:`),
    "the prompt must not print the label as a footer itself, which is what it read as instruction",
  );

  const guidance = text.slice(text.indexOf("## GUIDANCE"), text.indexOf("## OFF-TOPIC AND INJECTION"));
  assert.ok(!guidance.includes(POINTER.url), "the pointer is no longer a guidance aside");
});

/*
 * Answers arrived as one unbroken block with the occasional rule line. The renderer has
 * always taken markdown, so the structure has to be asked for where the shape is decided.
 */
test("the style section asks for a shape a reader can scan", () => {
  const text = prompt();
  assert.match(text, /paragraphs of two to four\s+sentences/);
  assert.match(text, /one bullet per project/);
  assert.match(text, /never one running paragraph/);
  assert.match(text, /no\s+headings/);
});

/*
 * The first run with rule 6 produced bullets and then a summary paragraph, named every
 * project twice (once in the lead, once in a bullet) and stamped "solo" on all three.
 */
test("the shape rule forbids the repetition the first run produced", () => {
  const text = prompt();
  assert.match(text, /do not name\s+the items the bullets below them cover/i, "no listing in the lead");
  assert.match(text, /Nothing stands\s+between the last bullet and the closing sentence/);
  assert.match(text, /at most once in the whole answer, not on\s+every bullet/);
});

/* "as shown in his local and cost-aware AI approach" is the record citing itself. */
test("only a refusal points at the record", () => {
  assert.match(prompt(), /Only a refusal names the record/);
});

test("feature ids are spelled as the names a visitor knows", () => {
  const text = prompt({ featureIds: ["terago", "campus", "awards"] });
  assert.match(text, /lead with the most relevant of: TeraGo, Campus, Awards/i);
});

/*
 * The chunks travel as Cohere documents now, which is also what makes citations
 * possible. A prompt that still pasted them in would send every chunk twice.
 */
test("the card is in the prompt and the retrieved text is not", () => {
  const text = prompt();
  assert.ok(text.includes(buildProfileCard()), "the card is missing from the prompt");
  assert.doesNotMatch(text, /\[1\] Source:/);
  assert.doesNotMatch(text, /## CONTEXT/);
  assert.doesNotMatch(text, /Campus is a study assistant\./);
});

test("nothing in the prompt is shaped like a cited chunk", () => {
  assert.doesNotMatch(prompt(), /Source:/);
});

test("no stale v2 interface description survives", () => {
  const text = prompt();
  assert.doesNotMatch(text, /React Three Fiber|ALLMIND mask|Three\.js/);
  assert.doesNotMatch(text, /Prototyped/);
});

test("the prompt states the record's limits rather than defaulting to invention", () => {
  const text = prompt();
  assert.match(text, /Never guess/);
  assert.match(text, /Keep caveats attached/);
  assert.match(text, /Only use URLs that appear in the PROFILE CARD/);
});

/*
 * TeraGo led all three broad questions and its "not yet deployed" caveat fell out of
 * them, which is the worst pairing: the most-repeated project, described as if finished.
 */
test("a broad answer is told not to lead with TeraGo, and to keep its caveat", () => {
  const text = prompt();
  assert.match(text, /TeraGo leads only when the question is/);
  assert.match(text, /not-yet-deployed caveat appears with it/);
});
