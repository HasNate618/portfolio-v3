import { test } from "node:test";
import assert from "node:assert/strict";
import { topicPins, withTopicPins } from "../src/app/api/chat/lib/context";
import { GENERAL, routeTopic } from "../src/app/api/chat/lib/topic";
import { getCorpusDoc } from "../src/lib/corpus";

const AI_QUESTION = "What AI work has Nathan done?";

test("an AI question pins the AI work, not the home page's lead", () => {
  const pins = topicPins(routeTopic(AI_QUESTION).feature).map((pin) => pin.source);
  assert.ok(pins.length >= 3, `expected at least 3 pins, got ${pins.length}: ${pins.join(", ")}`);
  assert.ok(pins.includes("experience/terago.md"), `TeraGo was not pinned: ${pins.join(", ")}`);
});

test("a named subject gets no pins", () => {
  const chunks = [{ text: "x", source: "projects/aware.md" }];
  const out = withTopicPins(chunks, "How does AWARE run models?", ["terago"]);
  assert.deepEqual(out, chunks);
});

test("pins still fire when retrieval is empty", () => {
  const out = withTopicPins([], "What does Nathan build?", GENERAL);
  assert.ok(out.length >= 3, `expected at least 3 pins, got ${out.length}`);
});

test("a chunk retrieval already returned is not pinned twice", () => {
  const pin = topicPins(["campus"])[0];
  assert.ok(pin, "campus must pin to test the dedupe");
  const out = withTopicPins([pin], "What does Nathan build?", ["campus"]);
  assert.equal(out.filter((chunk) => chunk.source === pin.source).length, 1);
});

test("a pin carries the summary, not only scalars", () => {
  const campus = topicPins(["campus"]).find((pin) => pin.source === "projects/campus.md");
  assert.ok(campus, "campus must pin");
  assert.match(campus.text, /^Summary: /m);
});

test("every pin names a real corpus document", () => {
  const pins = topicPins(GENERAL);
  assert.ok(pins.length >= 3);

  for (const pin of pins) {
    assert.ok(getCorpusDoc(pin.source), `${pin.source} is not in the corpus`);
    assert.ok(pin.text.length > 20, `${pin.source} pinned an empty chunk`);
  }
});

/*
 * The pinned ids come from a regex, and a regex can name something the corpus does
 * not hold. A missing doc is skipped rather than pinned as an empty string, which
 * would reach the model as a document with no content.
 */
test("an id with no doc is skipped", () => {
  assert.deepEqual(topicPins(["no-such-project"]), []);
});
