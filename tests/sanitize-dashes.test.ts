import { test } from "node:test";
import assert from "node:assert/strict";
import { DashFilter, sanitizeDashes } from "../src/app/api/chat/lib/sanitize-dashes";

const BANNED = /[\u2013\u2014\u2011]/;

test("no banned dash survives any of the shapes a live answer used", () => {
  const samples = [
    "every component\u2014from the perception pipeline to the rules engine",
    "**Campus** \u2013 his flagship project",
    "May 2026 \u2013 Aug 2026",
    "Sep 2025 \u2014 Aug 2026",
    "his self\u2011hosted study assistant",
    "a 3rd\u2011year student",
    "2024\u20132025",
  ];

  for (const sample of samples) {
    assert.doesNotMatch(sanitizeDashes(sample), BANNED, sample);
  }
});

test("a date range reads as to, whatever its punctuation", () => {
  assert.equal(sanitizeDashes("May 2026 \u2013 Aug 2026"), "May 2026 to Aug 2026");
  assert.equal(sanitizeDashes("Sep 2025 \u2014 Aug 2026"), "Sep 2025 to Aug 2026");
  assert.equal(sanitizeDashes("2024 \u2013 2025"), "2024 to 2025");
});

test("a separator reads as a colon, and an aside as a comma", () => {
  assert.equal(sanitizeDashes("**Campus** \u2013 his flagship"), "**Campus**: his flagship");
  assert.equal(
    sanitizeDashes("one board\u2014no cloud inference"),
    "one board, no cloud inference",
  );
});

test("a non-breaking hyphen becomes a plain one", () => {
  assert.equal(sanitizeDashes("self\u2011hosted"), "self-hosted");
});

test("a line-opening dash becomes a bullet, and the newline survives", () => {
  const out = sanitizeDashes("What it does\n\u2013 indexes files\n\u2014 searches them");
  assert.equal(out, "What it does\n- indexes files\n- searches them");
  assert.equal(out.split("\n").length, 3, "a list break must not be joined");
});

test("streaming agrees with the whole string, at every split point", () => {
  const samples = [
    "He was VP of Data/ML \u2013 he co-led two developers.",
    "Runs from May 2026 \u2013 Aug 2026 on one $80 board.",
    "It is self\u2011hosted, and every component\u2014from the camera to the rules engine\u2014runs locally.",
    "What he built\n\u2013 an outage-email parser\n\u2013 Channel Finder",
  ];

  for (const sample of samples) {
    const whole = sanitizeDashes(sample);
    assert.doesNotMatch(whole, BANNED, sample);

    for (let split = 1; split < sample.length; split += 1) {
      const filter = new DashFilter();
      const streamed =
        filter.push(sample.slice(0, split)) + filter.push(sample.slice(split)) + filter.flush();
      assert.equal(streamed, whole, `split at ${split}: ${sample}`);
    }
  }
});

test("the filter never ends a chunk on a space or a dash", () => {
  const filter = new DashFilter();
  const first = filter.push("He worked at TeraGo for the summer \u2013 a role in Markham, Ontario");
  assert.ok(first.length > 0, "a long chunk must produce output");
  assert.doesNotMatch(first, /[ \t\u2013\u2014]$/);
});

test("a dash at the edge of a chunk is not mistaken for a bullet", () => {
  const filter = new DashFilter();
  const streamed =
    filter.push("He was VP of Data/ML ") +
    filter.push("\u2013 he co-led") +
    filter.push(" two developers.") +
    filter.flush();
  assert.equal(streamed, "He was VP of Data/ML: he co-led two developers.");
});

test("a short answer is not lost: the tail arrives on flush", () => {
  const filter = new DashFilter();
  const first = filter.push("Short \u2013 answer");
  assert.ok(first.length > 0, "text before an undecided dash is still sent");
  assert.equal(first + filter.flush(), "Short: answer");
});
