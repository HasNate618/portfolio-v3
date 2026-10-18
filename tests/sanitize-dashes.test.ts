import { test } from "node:test";
import assert from "node:assert/strict";
import { DashFilter, sanitizeDashes } from "../src/app/api/chat/lib/sanitize-dashes";

const BANNED = /[\u2010-\u2015\u00a0\u202f]/;

test("no banned dash survives any of the shapes a live answer used", () => {
  const samples = [
    "every component\u2014from the perception pipeline to the rules engine",
    "**Campus** \u2013 his study assistant",
    "May 2026 \u2013 Aug 2026",
    "Sep 2025 \u2014 Aug 2026",
    "his self\u2011hosted study assistant",
    "a 3rd\u2011year student",
    "2024\u20132025",
    "Aug 2024\u202f\u2013\u202fMay 2028",
    "May 2026\u00a0\u2013\u00a0Aug 2026",
    "a \u2015 horizontal bar",
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

/*
 * The shape the model writes most often: one month, then the closing month and
 * year. The lookbehind used to demand a year of its own on the left, so this
 * never matched the range rule and fell through to the colon rule, and a live
 * answer read "May: Aug 2026".
 */
test("a month range is a range even with no year on the left", () => {
  assert.equal(sanitizeDashes("May\u2013Aug 2026"), "May to Aug 2026");
  assert.equal(sanitizeDashes("Intern (May\u2013Aug 2026)"), "Intern (May to Aug 2026)");
  assert.equal(sanitizeDashes("2024\u20132028"), "2024 to 2028");
});

/*
 * Live regression: an answer wrote "**Animarker** \u2013 May 2023" and the range rule
 * turned a separator into a range, so the output said the project ran until May
 * 2023. A range needs a date on both sides of the dash.
 */
test("a dash between a name and a month is a separator, not a range", () => {
  assert.equal(
    sanitizeDashes("**Animarker** \u2013 May 2023, built solo"),
    "**Animarker**: May 2023, built solo",
  );
  assert.equal(
    sanitizeDashes("**AWARE** \u2013 Jul 2026, a 1B model"),
    "**AWARE**: Jul 2026, a 1B model",
  );
  // An em dash is an aside, so it keeps reading as a comma; an en dash separates.
  assert.equal(sanitizeDashes("Campus \u2014 Aug 2026"), "Campus, Aug 2026");
});

test("a separator reads as a colon, and an aside as a comma", () => {
  assert.equal(sanitizeDashes("**Campus** \u2013 his study assistant"), "**Campus**: his study assistant");
  assert.equal(
    sanitizeDashes("one board\u2014no cloud inference"),
    "one board, no cloud inference",
  );
});

test("a non-breaking hyphen becomes a plain one", () => {
  assert.equal(sanitizeDashes("self\u2011hosted"), "self-hosted");
});

/*
 * The case the first version got wrong in production: the model wrote the range
 * with narrow no-break spaces, the date rule did not match, and a live answer
 * read "Aug 2024 :  May 2028".
 */
test("a date range punctuated with no-break spaces still reads as to", () => {
  assert.equal(sanitizeDashes("Aug 2024\u202f\u2013\u202fMay 2028"), "Aug 2024 to May 2028");
  assert.equal(sanitizeDashes("May 2026\u00a0\u2013\u00a0Aug 2026"), "May 2026 to Aug 2026");
});

test("spaces that break copy and search become plain spaces", () => {
  assert.equal(sanitizeDashes("Brampton\u00a0and London"), "Brampton and London");
  assert.equal(sanitizeDashes("2,559\u202fcases"), "2,559 cases");
  assert.equal(sanitizeDashes("zero\u200bwidth"), "zerowidth");
  assert.equal(sanitizeDashes("a\tb"), "a\tb", "a tab can be meaningful in a code block");
});

test("hyphen and bar look-alikes are handled too", () => {
  assert.equal(sanitizeDashes("co\u2010operate"), "co-operate");
  assert.equal(sanitizeDashes("a\u2012b"), "a-b");
  assert.equal(sanitizeDashes("one board \u2015 no cloud"), "one board, no cloud");
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
    "Aug 2024\u202f\u2013\u202fMay 2028 at Western, with a second range May 2026 \u2014 Aug 2026 here.",
    "He interned at TeraGo May\u2013Aug 2026, then went back to school.",
    "What he built\n\u2013 an outage-email parser\n\u2013 Channel Finder",
    "**Animarker** \u2013 May 2023, built solo at a hackathon.",
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
  assert.doesNotMatch(first, /[ \t\u2013\u2014\u00a0\u202f]$/);
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
  // The word before a dash is held with it now, so an answer that starts with a
  // dash and no earlier text emits nothing until it is decided.
  const first = filter.push("He built a parser at TeraGo \u2013 a job in Markham");
  assert.ok(first.length > 0, "text before the held word is still sent");
  assert.equal(first + filter.flush(), "He built a parser at TeraGo: a job in Markham");
});
