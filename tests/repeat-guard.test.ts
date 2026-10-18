import { test } from "node:test";
import assert from "node:assert/strict";
import { RepeatGuard } from "../src/app/api/chat/lib/repeat-guard";

/** 40+ characters, so the line rule applies to it. */
const LINE = "Nathan built Campus as a study assistant in 2026.";

function drain(guard: RepeatGuard, chunks: string[]): string {
  return chunks.map((chunk) => guard.push(chunk)).join("") + guard.flush();
}

test("a line repeated three times aborts, and the visitor sees it twice", () => {
  const guard = new RepeatGuard();
  const out = drain(guard, [`${LINE}\n`, `${LINE}\n`, `${LINE}\n`]);

  assert.equal(guard.aborted, true);
  assert.equal(out.split(LINE).length - 1, 2, `expected the line twice, got: ${JSON.stringify(out)}`);
});

test("a repeated 200-character block aborts", () => {
  const block = "abcdefghij".repeat(20);
  const guard = new RepeatGuard();
  const out = drain(guard, [block, block]);

  assert.equal(guard.aborted, true);
  assert.equal(out, block, "the second copy is dropped");
});

test("ordinary prose passes through untouched", () => {
  const text = [
    "Nathan built Campus as a study assistant.",
    "He also worked at TeraGo on a Java parser.",
    "The homelab runs NixOS on three machines.",
    "",
  ].join("\n");

  const guard = new RepeatGuard();
  assert.equal(drain(guard, [text]), text);
  assert.equal(guard.aborted, false);
});

test("a short line repeated is not a loop", () => {
  // Under 30 characters, so it is a heading or a list marker rather than a loop.
  const guard = new RepeatGuard();
  const out = drain(guard, ["- ok\n", "- ok\n", "- ok\n", "- ok\n"]);

  assert.equal(guard.aborted, false);
  assert.equal(out, "- ok\n- ok\n- ok\n- ok\n");
});

test("a short chunk is held back until it can be judged", () => {
  const guard = new RepeatGuard();
  assert.equal(guard.push("Nathan built Campus.\n"), "");
  assert.equal(guard.flush(), "Nathan built Campus.\n");
});

test("after an abort nothing more is released", () => {
  const guard = new RepeatGuard();
  drain(guard, [`${LINE}\n`, `${LINE}\n`, `${LINE}\n`]);

  assert.equal(guard.push("and then it kept going\n"), "");
  assert.equal(guard.flush(), "");
});
