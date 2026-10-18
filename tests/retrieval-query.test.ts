import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRetrievalQuery } from "../src/app/api/chat/lib/retrieval-query";

const AWARE_HISTORY = [
  { role: "user", content: "Tell me about AWARE" },
  { role: "assistant", content: "**AWARE** turns English into rules and runs locally." },
];

test("a pronoun after an AWARE answer puts AWARE first", () => {
  assert.match(buildRetrievalQuery("What models does it run?", AWARE_HISTORY), /^AWARE:/);
});

test("a question that names its own subject is not prefixed", () => {
  const query = buildRetrievalQuery("How does Campus work?", AWARE_HISTORY);
  assert.doesNotMatch(query, /^AWARE:/);
  assert.match(query, /How does Campus work\?/);
});

test("no history means no prefix", () => {
  assert.equal(buildRetrievalQuery("What models does it run?", []), "What models does it run?");
});

test("the subject can come from the answer when the question named none", () => {
  const history = [
    { role: "user", content: "What are his strongest projects?" },
    { role: "assistant", content: "**Homelab** is the deepest build." },
  ];
  // The prefix is the visitor-facing name, not the id: that project's name is
  // "NixOS homelab", and an embedding knows it better than the word "homelab".
  assert.match(buildRetrievalQuery("Tell me more about those", history), /^NixOS homelab:/);
});

test("a message with no pronoun is not prefixed", () => {
  const query = buildRetrievalQuery("What did Nathan build at TeraGo?", AWARE_HISTORY);
  assert.doesNotMatch(query, /^AWARE:/);
});
