import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * The eval costs money and minutes, so everything checkable about its fixture is
 * checked here instead: a threshold miss during a paid run is the one failure that
 * should never be a typo. No Cohere calls happen in this file.
 */

interface EvalItem {
  id: string;
  q: string;
  broad?: boolean;
  core?: boolean;
  mustAnyMin?: number;
  yesNo?: boolean;
  followUpOf?: string;
  mustAny?: string[][];
  mustNot: string[];
}

interface EvalFile {
  seeds: Record<string, string>;
  items: EvalItem[];
}

const file = JSON.parse(
  readFileSync(new URL("./eval/chat-eval.json", import.meta.url), "utf8"),
) as EvalFile;

test("the eval has twenty questions", () => {
  assert.equal(file.items.length, 20);
});

/*
 * The default run is the core twelve, so the core has to be able to see every threshold
 * the full run gates: spread is measured over the broad items, the claim bans and the
 * seeded follow-up each need a representative. Without this, a future tidy-up could
 * shrink the fast loop until it passes for want of a question.
 */
test("the core subset can reach every threshold", () => {
  const core = file.items.filter((item) => item.core);
  const coreIds = new Set(core.map((item) => item.id));

  assert.equal(core.length, 12, "core is twelve questions");

  for (const item of file.items.filter((entry) => entry.broad)) {
    assert.ok(coreIds.has(item.id), `${item.id} is broad, and spread is measured over broad items`);
  }

  assert.ok(
    core.some((item) => item.mustNot.length > 0),
    "no core question forbids a claim, so the mustNot row would always pass",
  );
  assert.ok(
    core.some((item) => item.followUpOf !== undefined),
    "no core question follows up on a seed, so the seeded history path is unexercised",
  );
});

test("ids are unique", () => {
  const ids = file.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate id");
});

test("every item has an id and a question", () => {
  for (const item of file.items) {
    assert.ok(item.id.length > 0, "an item has no id");
    assert.ok(item.q.length > 0, `${item.id} has no question`);
  }
});

test("every item states at least one expectation", () => {
  for (const item of file.items) {
    const groups = item.mustAny ?? [];
    assert.ok(groups.length > 0, `${item.id} has no mustAny groups`);
    for (const group of groups) {
      assert.ok(Array.isArray(group) && group.length > 0, `${item.id} has an empty mustAny group`);
    }
  }
});

test("every mustNot is a string", () => {
  for (const item of file.items) {
    assert.ok(Array.isArray(item.mustNot), `${item.id} mustNot is not an array`);
    for (const pattern of item.mustNot) {
      assert.equal(typeof pattern, "string", `${item.id} has a non-string mustNot`);
    }
  }
});

test("every regex compiles", () => {
  for (const item of file.items) {
    for (const group of item.mustAny ?? []) {
      for (const pattern of group) assert.doesNotThrow(() => new RegExp(pattern, "i"), `${item.id}: ${pattern}`);
    }
    for (const pattern of item.mustNot) {
      assert.doesNotThrow(() => new RegExp(pattern, "i"), `${item.id}: ${pattern}`);
    }
  }
});

test("a follow-up names a seed", () => {
  for (const item of file.items) {
    if (!item.followUpOf) continue;
    assert.ok(
      Object.hasOwn(file.seeds, item.followUpOf),
      `${item.id} follows up on "${item.followUpOf}", which is not a seed`,
    );
  }
});

test("the broad questions are the ones the spread is measured on", () => {
  const broad = file.items.filter((item) => item.broad).map((item) => item.id);
  assert.deepEqual(broad, ["strongest", "ai-work", "builds"]);
});

/*
 * Two ways a question can be scored loosely enough to stop meaning anything: a minimum
 * of zero groups, which makes the expectation unfalsifiable, or a yes/no length exemption
 * on a question that checks nothing else.
 */
test("a question's minimum is a real subset of what it asks for", () => {
  for (const item of file.items) {
    if (item.mustAnyMin === undefined) continue;
    const groups = item.mustAny?.length ?? 0;
    assert.ok(item.mustAnyMin >= 1, `${item.id} requires no groups at all`);
    assert.ok(item.mustAnyMin <= groups, `${item.id} requires more groups than it declares`);
  }
});

test("a yes/no exemption still bans a claim", () => {
  for (const item of file.items.filter((entry) => entry.yesNo)) {
    assert.ok(item.mustNot.length > 0, `${item.id} is exempt from the length rule and checks nothing`);
  }
});
