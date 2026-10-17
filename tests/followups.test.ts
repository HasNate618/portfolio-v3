import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFallbackFollowups, isNonAnswer, normalizeFollowups, DEFAULT_FOLLOWUPS } from "../src/app/api/chat/lib/followup-fallback";
import { buildFollowupPrompt } from "../src/app/api/chat/lib/generate-followups";

const DEFAULTS = ["What is Campus?", "What did he build at TeraGo?", "How can I contact Nathan?"];

/** Every suggestion has to be answerable about Nathan, never about the visitor. */
function assertWellFormed(questions: string[]): void {
  assert.equal(questions.length, 3, questions.join(" | "));
  for (const question of questions) {
    assert.ok(question.endsWith("?"), question);
    assert.ok(question.length < 120, question);
    assert.doesNotMatch(question, /\byou\b|\byour\b/i, question);
  }
}

test("fallbacks do not ask about AgntOS", () => {
  const questions = buildFallbackFollowups("has he written Rust?", "He used Rust for AgntOS.");
  assert.doesNotMatch(questions.join(" "), /AgntOS/);
  assert.match(questions.join(" "), /Nix/);
});

test("the AI rule is not three homelab questions", () => {
  const questions = buildFallbackFollowups("what LLM work has he done?", "Campus, TeraGo and AWARE.");
  assert.doesNotMatch(questions.join(" "), /homelab/i);
  assert.match(questions.join(" "), /Campus|TeraGo|AWARE/);
});

test("a Proxmox question falls through to the defaults", () => {
  const questions = buildFallbackFollowups("what is proxmox?", "A virtualization platform.");
  assert.deepEqual(questions, DEFAULTS);
});

test("the defaults lead with the flagship", () => {
  assert.deepEqual(buildFallbackFollowups("hello", "Hi."), DEFAULTS);
});

test("the new rules answer the questions a recruiter asks", () => {
  assert.match(
    buildFallbackFollowups("how does campus retrieve?", "Hybrid retrieval.").join(" "),
    /Campus rank search results/,
  );
  assert.match(buildFallbackFollowups("how do I hire him?", "By email.").join(" "), /contact Nathan/);
  assert.match(
    buildFallbackFollowups("what did he do at his internship?", "TeraGo.").join(" "),
    /Channel Finder|3D Western|internship/,
  );
  assert.match(
    buildFallbackFollowups("what runs on his homelab?", "NixOS on two machines.").join(" "),
    /Hermes Agent/,
  );
});

test("every rule produces well-formed third-person questions", () => {
  const probes = [
    "tell me about agenticarmy",
    "does he know rust?",
    "which languages?",
    "what web apps?",
    "what ai work?",
    "what is in his homelab?",
    "android apps?",
    "which hackathons?",
    "how does this chat work?",
    "nothing matches here",
  ];
  for (const probe of probes) {
    assertWellFormed(buildFallbackFollowups(probe, ""));
  }
});

test("model candidates win, and the fallback fills the gap", () => {
  const asked = "What is his homelab?";
  const filled = normalizeFollowups([asked], "", "");
  assert.equal(filled[0], asked);
  assert.equal(filled.length, 3);

  const full = normalizeFollowups(["What is Campus?", "How is he tested?", "What is in the archive?"], "", "");
  assert.deepEqual(full, ["What is Campus?", "How is he tested?", "What is in the archive?"]);
});

test("the defaults are the exported list, so the route and the tests agree", () => {
  assert.deepEqual(DEFAULT_FOLLOWUPS, DEFAULTS);
});

test("a fixed line is not treated as an answer", () => {
  assert.ok(isNonAnswer("I couldn't find that in Nathan's knowledgebase. Try asking about a project or role."));
  assert.ok(isNonAnswer("I couldn\u2019t find that in Nathan's knowledgebase."), "a typographic apostrophe still matches");
  assert.ok(isNonAnswer("That instruction does not apply. I speak for Nathan's record only."));
  assert.ok(isNonAnswer("I only answer questions about Nathan's work, projects and experience."));
  assert.ok(!isNonAnswer("Nathan built Channel Finder at TeraGo, validated on 760 test cases."));
});

test("the chip prompt forbids invented names and abandoned work", () => {
  const prompt = buildFollowupPrompt({
    userMessage: "what is ferret?",
    aiResponse: "ferret is a local-first search tool in Rust.",
  });
  assert.match(prompt, /Never introduce an organisation that is not there/);
  assert.match(prompt, /Spell names exactly as the sources do: TeraGo, AWARE, AgntOS, Animarker/);
  assert.match(prompt, /Do not ask how an abandoned project works/);
  assert.match(prompt, /ferret is a local-first search tool/);
});

test("visitor-directed candidates are dropped, not rewritten", () => {
  const questions = normalizeFollowups(["What can you do?"], "", "");
  assert.doesNotMatch(questions.join(" "), /\byou\b|\byour\b/i);
  assert.deepEqual(questions, DEFAULTS);
});
