import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProfileCard } from "../src/app/api/chat/lib/profile-card";
import { TEAM_NO_ROLE_IDS } from "../src/app/api/chat/lib/chips-validate";
import { BANNED_WORD_PATTERNS } from "../src/lib/banned-words";
import { speaksAsNathan } from "../src/lib/voice";
import { awardFor, site } from "../src/data/site";

const card = buildProfileCard();
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The card line for a project, which is the only line that names it with a "(". */
function projectLine(name: string): string {
  return card.split("\n").find((line: string) => line.startsWith("- ") && line.includes(`${name} (`)) ?? "";
}

test("the card restates site.ts rather than inventing", () => {
  for (const project of site.projects) {
    assert.match(card, new RegExp(escape(project.name)), `${project.name} is missing from the card`);
  }
  for (const role of site.experience) {
    assert.match(card, new RegExp(escape(role.org)), `${role.org} is missing from the card`);
  }
  assert.match(card, /May 2028/);
  assert.match(card, /Summer 2027/);
  assert.match(card, new RegExp(escape(site.contact.email)));
  // The word list itself, not a copy of it: check:words scans tests/ too, so a
  // test that spells the word is the one hit it will find.
  for (const banned of BANNED_WORD_PATTERNS) {
    assert.doesNotMatch(card, banned.re, `the card says "${banned.word}"`);
  }
});

test("every project gets exactly one line", () => {
  for (const project of site.projects) {
    assert.notEqual(projectLine(project.name), "", `${project.name} has no card line`);
  }
});

/*
 * The prototype read its list of solo projects as "solo wins". A negative has to
 * be stated, not implied, so the card says neither of them won.
 */
test("solo is not an award", () => {
  assert.match(card, /Neither won an award/);
  assert.match(card, /Built solo: AWARE \(Hack the 6ix 2026\) and Animarker \(May 2023\)/);
});

/*
 * The sentence above is typed, so the fact it asserts is derived instead: if a solo
 * hackathon project ever wins something, this fails rather than leaving the card
 * claiming that neither of the two did.
 */
test("the solo sentence names the only solo hackathon projects without an award", () => {
  const solo = site.projects.filter(
    (project) => project.displayRole === "solo" && project.event && !awardFor(project.name),
  );
  assert.deepEqual(solo.map((project) => project.name), ["AWARE", "Animarker"]);
});

test("team projects without a recorded role say so", () => {
  for (const id of TEAM_NO_ROLE_IDS) {
    const name = site.projects.find((project) => project.id === id)!.name;
    assert.match(
      card,
      new RegExp(`${escape(name)}[\\s\\S]{0,400}built with his team; his own part is not on record`, "i"),
      `${name} claims a role the record does not have`,
    );
  }
});

test("AWARE is never called offline, and ferret is", () => {
  for (const line of card.split("\n")) {
    if (!/\bAWARE\b/.test(line)) continue;
    assert.doesNotMatch(line, /\boffline\b/i, `AWARE line calls it offline: ${line}`);
  }
  assert.match(card, /no cloud inference/i);
  assert.match(card, /\bferret\b[^\n]*offline/i, "ferret is the project that runs fully offline");
});

test("the 3D Western caveat says the labels were machine-checked", () => {
  assert.match(card, /VLM-checked/);
  assert.doesNotMatch(card, /human-labell?ed/i, "the labels were not human-labelled");
});

test("Campus keeps its limit, and the homelab keeps the gate", () => {
  assert.match(card, /Campus[^\n]*no approval gate and no rollback/i);
  assert.match(card, /homelab[^\n]*(gates|gate)/i);
});

test("unshipped work stays unshipped", () => {
  assert.match(card, /prototype[^\n]{0,120}working end to end/i);
  assert.equal((card.match(/working end to end/gi) ?? []).length, 1, "the TeraGo clause is not repeated");
  assert.match(card, /no contributions claimed this term/i);
});

/*
 * The spec's 220 characters is a target rather than a hard bound: 8 of the 25
 * lines run up to 293, because the header carries dates, role, event, status and
 * award. The bound tested is 300 with a median inside the target, so the card
 * stays scannable without dropping a field. A line carrying a limit may run
 * longer still: the limit is the caveat the grounding rules require.
 */
test("project lines stay short enough to read", () => {
  for (const project of site.projects) {
    const covers = projectLine(project.name).split(": ").slice(1).join(": ");
    assert.ok(covers.length > 0, `${project.name} has no covers sentence`);
  }

  const lengths = site.projects.filter((p) => !p.limits).map((project) => projectLine(project.name).length);
  const sorted = [...lengths].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const longest = Math.max(...lengths);

  assert.ok(longest <= 300, `the longest project line is ${longest} characters`);
  assert.ok(median <= 220, `the median project line is ${median} characters`);
});

test("an abandoned project is marked as one", () => {
  for (const project of site.projects.filter((p) => p.displayStatus === "abandoned")) {
    assert.match(projectLine(project.name), /ABANDONED, mention only if asked/);
  }
});

/*
 * The card is a claim about him, and the prompt it is inserted into forbids
 * speaking as Nathan. site.ts carries two live first-person fragments in
 * displayRole alone, so the turn-around is asserted over the whole card rather
 * than over the fields I happened to remember.
 */
test("the card never speaks as Nathan", () => {
  for (const line of card.split("\n")) {
    assert.ok(!speaksAsNathan(line), `the card speaks in the first person: ${line}`);
  }
});

/*
 * An answer counted the rows of AWARE's model table and said four, when the record lists
 * five. A count the model derives is a count it can get wrong, so the card states it.
 */
test("a project with a model list states how many it runs", () => {
  const line = card.split("\n").find((entry) => /^- AWARE\b/.test(entry)) ?? "";
  assert.match(line, /5 on-device models/, line);
});

/*
 * Both covers open with context ("Built solo at...", "My first hackathon..."),
 * which repeated the event and role the facts already list. The card's one line
 * of detail has to describe what the project does.
 */
test("AWARE and Animarker describe the project, not just the event", () => {
  const aware = card.split("\n").find((entry) => /^- AWARE\b/.test(entry)) ?? "";
  const animarker = card.split("\n").find((entry) => /^- Animarker\b/.test(entry)) ?? "";
  assert.match(aware, /watches a camera/i);
  assert.doesNotMatch(aware, /: Built solo at Hack the 6ix 2026\./);
  assert.match(animarker, /wildlife tracker/i);
  assert.doesNotMatch(animarker, /: His first hackathon, done solo\./);
});

test("only a project with a model list carries a count", () => {
  const lines = card.split("\n").filter((entry) => /on-device models/.test(entry));
  assert.equal(lines.length, 1, `one project states a model count:\n${lines.join("\n")}`);
  assert.match(lines[0] ?? "", /^- AWARE\b/);
});
