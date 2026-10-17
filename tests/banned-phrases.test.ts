import { test } from "node:test";
import assert from "node:assert/strict";
import { BannedPhraseFilter, stripBannedPhrases } from "../src/app/api/chat/lib/banned-phrases";

test("a banned phrase leaves with the comma that introduced it", () => {
  assert.equal(
    stripBannedPhrases("These qualities show a mature, production-grade tool that he relies on."),
    "These qualities show a mature tool that he relies on.",
  );
  assert.equal(stripBannedPhrases("a practical, production-ready workflow"), "a practical workflow");
  assert.equal(stripBannedPhrases("a production-grade tool"), "a tool");
  assert.equal(stripBannedPhrases("It is Production-Grade work."), "It is work.");
});

test("a phrase repeated in one sentence is removed twice", () => {
  assert.equal(stripBannedPhrases("a production-ready, production-grade system"), "a system");
});

test("a true sentence is untouched", () => {
  const trueSentences = [
    "Campus has no approval gate and no rollback; the NixOS homelab is the project that gates changes and rolls them back.",
    "I care about the boring parts too: tests in CI, data that syncs cleanly, changes I can roll back.",
    "Campus runs 308 tests in CI on every push.",
    "His NixOS homelab gates changes behind nixos-safe-rebuild.",
  ];

  for (const sentence of trueSentences) {
    assert.equal(stripBannedPhrases(sentence), sentence);
  }
});

test("streaming agrees with the whole string at every split point", () => {
  const samples = [
    "These qualities show a mature, production-grade tool.",
    "a practical, production-ready workflow that he uses",
    "Campus is a production-grade tool he relies on daily.",
    "In his homelab the model proposes a change, with rollback behind it.",
    "Production-ready, and it runs on any OpenAI-compatible endpoint.",
  ];

  for (const sample of samples) {
    const whole = stripBannedPhrases(sample);
    assert.doesNotMatch(whole, /production-(?:grade|ready)/i, sample);

    for (let split = 1; split < sample.length; split += 1) {
      const filter = new BannedPhraseFilter();
      const streamed = filter.push(sample.slice(0, split)) + filter.push(sample.slice(split)) + filter.flush();
      assert.equal(streamed, whole, `split at ${split}: ${sample}`);
    }
  }
});

test("a partial phrase is held, never emitted", () => {
  const filter = new BannedPhraseFilter();
  const first = filter.push("Campus is a mature, production-");
  assert.equal(first, "Campus is a mature");
  assert.doesNotMatch(first, /production/);
  assert.equal(first + filter.push("grade tool.") + filter.flush(), "Campus is a mature tool.");
});

test("text with no banned phrase streams through unchanged", () => {
  const filter = new BannedPhraseFilter();
  const parts = ["He built a parser. ", "It works end to end, ", "but it is not deployed."];
  const streamed = parts.map((part) => filter.push(part)).join("") + filter.flush();
  assert.equal(streamed, parts.join(""));
});

test("the filter counts what it removed, for the log", () => {
  const filter = new BannedPhraseFilter();
  filter.push("a mature, production-grade tool and a production-ready workflow");
  filter.flush();
  assert.equal(filter.removed, 2);
});
