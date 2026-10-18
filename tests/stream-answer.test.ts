import { test } from "node:test";
import assert from "node:assert/strict";
import {
  finalizeAnswer,
  MAX_ANSWER_CHARS,
  streamAnswer,
  type AnswerDelta,
  type StreamAnswerOptions,
} from "../src/app/api/chat/lib/stream-answer";

/** Deltas as the Cohere stream delivers them: content, sometimes thinking. */
function attempt(...deltas: Array<{ text?: string; thinking?: boolean }>): AsyncIterable<AnswerDelta> {
  return (async function* () {
    for (const delta of deltas) {
      yield { type: "content-delta", delta: { message: { content: delta } } };
    }
  })();
}

/** Hands out one iterable per attempt, repeating the last one if called again. */
function sources(...streams: AsyncIterable<AnswerDelta>[]): () => Promise<AsyncIterable<AnswerDelta>> {
  let index = 0;
  return () => Promise.resolve(streams[Math.min(index++, streams.length - 1)]);
}

async function collect(options: Omit<StreamAnswerOptions, "emit">) {
  const emitted: string[] = [];
  const result = await streamAnswer({ ...options, emit: (text) => emitted.push(text) });
  return { ...result, emitted: emitted.join("") };
}

test("an answer with visible text is used as it is", async () => {
  const result = await collect({ start: sources(attempt({ text: "Campus runs 308 tests." })) });
  assert.equal(result.text, "Campus runs 308 tests.");
  assert.equal(result.attempts, 1);
  assert.equal(result.emitted, "Campus runs 308 tests.");
  assert.equal(result.retried, false);
});

test("a stream that returns only thinking is retried once", async () => {
  const result = await collect({
    start: sources(
      attempt({ text: "reasoning about the question", thinking: true }),
      attempt({ text: "He runs 308 tests in CI." }),
    ),
  });

  assert.equal(result.text, "He runs 308 tests in CI.");
  assert.equal(result.attempts, 2);
  assert.equal(result.retried, true);
  assert.equal(result.emitted, "He runs 308 tests in CI.", "the empty first attempt emitted nothing");
  assert.ok(!result.emitted.includes("reasoning"), "thinking must never be emitted");
});

test("a whitespace-only answer counts as empty", async () => {
  const result = await collect({
    start: sources(attempt({ text: "\n\n  " }), attempt({ text: "760 test cases at TeraGo." })),
  });
  assert.equal(result.text, "760 test cases at TeraGo.");
  assert.equal(result.attempts, 2);
  assert.equal(result.retried, true);
});

test("two empty answers end in an honest line, not a blank bubble", async () => {
  const result = await collect({ start: sources(attempt({ thinking: true }), attempt({ thinking: true })) });
  assert.equal(result.attempts, 2);
  assert.equal(result.retried, true, "it tried again, and stopped");
  // A blank bubble was the outcome a visitor actually saw when both attempts came back empty.
  assert.match(result.text, /could not put that answer together/);
  assert.match(result.text, /@/, "the line offers the address the site holds");
});

test("dashes are converted as the text streams", async () => {
  const result = await collect({
    start: sources(attempt({ text: "He was VP of Data/ML " }, { text: "\u2013 he co-led two developers." })),
  });
  assert.equal(result.text, "He was VP of Data/ML: he co-led two developers.");
});

test("the character cap stops a runaway answer", async () => {
  const result = await collect({
    start: sources(attempt({ text: "x".repeat(500) }, { text: "y".repeat(500) })),
    maxChars: 300,
  });
  assert.equal(result.truncated, true);
  assert.ok(result.text.length <= 300 + 24, `emitted ${result.text.length}`);
});

test("a looping answer is cut at the repeat", async () => {
  const line = "Nathan built Campus as a study assistant in 2026.";
  const result = await collect({
    start: sources(
      attempt({ text: `${line}\n` }, { text: `${line}\n` }, { text: `${line}\n` }, { text: `${line}\n` }),
    ),
  });

  assert.equal(result.truncated, true);
  assert.equal(
    result.text.split(line).length - 1,
    2,
    `the loop was not cut: ${JSON.stringify(result.text)}`,
  );
});

test("an aborted request consumes nothing and does not retry", async () => {
  const result = await collect({
    start: sources(attempt({ text: "never sent" }), attempt({ text: "also never sent" })),
    stopped: () => true,
  });
  assert.equal(result.text, "");
  assert.equal(result.attempts, 1);
  assert.equal(result.emitted, "");
});

test("an abort mid-answer keeps the text already sent and does not retry", async () => {
  let checks = 0;
  const result = await collect({
    start: sources(attempt({ text: "He built " }, { text: "and more" }), attempt({ text: "never sent" })),
    stopped: () => {
      checks += 1;
      return checks > 1;
    },
  });
  assert.equal(result.text, "He built ");
  assert.equal(result.attempts, 1, "a partial answer must not be retried");
  assert.equal(result.emitted, "He built ");
});

/*
 * The eval reads whole messages, so it needs the stream's filters over a finished
 * string. Each case is one way the first stage 4 run graded text no visitor received.
 */
test("finalizeAnswer deletes a phrase the phrase filter deletes", () => {
  const out = finalizeAnswer("Campus is a production-ready study tool.");
  assert.ok(!/production-(?:grade|ready)/i.test(out), out);
  assert.match(out, /Campus/, "the rest of the sentence survives");
});

test("finalizeAnswer sanitizes a dash", () => {
  const out = finalizeAnswer("It is fast \u2014 and local.");
  assert.ok(!/[\u2013\u2014]/.test(out), out);
});

test("finalizeAnswer caps the answer at the length a visitor would get", () => {
  const out = finalizeAnswer("word ".repeat(4000), 100);
  assert.ok(out.length <= 100, `${out.length} characters`);
});

/* Every filter holds a short tail. A finished answer that is shorter than the held
 * window must still come back whole, or the eval would measure a truncated last word. */
test("finalizeAnswer releases a short answer's held tail", () => {
  assert.equal(finalizeAnswer("Short answer."), "Short answer.");
});

test("the default cap is the served cap", () => {
  assert.equal(MAX_ANSWER_CHARS, 6000);
});
