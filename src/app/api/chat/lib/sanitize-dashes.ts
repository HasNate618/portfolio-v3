/**
 * Dashes, made deterministic.
 *
 * Rule 14 asks the model for commas, colons and plain hyphens. One live answer
 * still shipped an em dash, en dashes as separators ("**Campus** \u2013 his...")
 * and U+2011 non-breaking hyphens inside words like "self-hosted", which also
 * break copy and search. A rule that has already failed once does not get to be
 * the only defence, so the answer is cleaned as it streams.
 *
 * Every replacement is decided by what follows the dash, plus the one word kept
 * back before it. That one word is what tells a date range from a separator: a
 * chunk can split at the dash, and without the left date "May 2026" a range and
 * "**Animarker**" look identical from the right.
 *
 * The filter therefore does two things. It holds a short tail, so a dash that
 * arrives split across two chunks is still seen with a character after it. And
 * when it does hold a dash, it waits for the whole word that follows, because
 * "2026 \u2013 20" would read as a colon and only become " to " once the rest of
 * "2025" landed, showing the visitor both. Waiting for one word is cheap; the
 * alternative is text that changes under the reader.
 *
 * Whitespace is normalised first, and that is not cosmetic either. A live answer
 * wrote "Aug 2024\u202f\u2013\u202fMay 2028" with narrow no-break spaces, which
 * the first version of this file turned into "Aug 2024 :  May 2028": the date
 * range rule never matched, so a range became a colon with the exotic spaces
 * left around it.
 */

/** Tail held while no dash is pending. A few characters of latency. */
const HELD_CHARS = 24;

/**
 * Spaces that break copy and search, plus the zero-width space. A tab is left
 * alone: it can be meaningful inside a code block.
 */
const EXOTIC_SPACE = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/g;
const ZERO_WIDTH_SPACE = /\u200b/g;

/** Dash-family characters that are not hyphens: em, en and the horizontal bar. */
const DASH_RANGE = "\\u2013\\u2014\\u2015";

/**
 * A dash is a range only between two dates: "May 2026 to Aug 2026", "2024 to
 * 2025", "May to Aug 2026". A live answer wrote "**Animarker** - May 2023", and a
 * rule that looked only ahead read it as a range, so the page said the project
 * ran until May 2023.
 *
 * The left side may be a bare month. Requiring a year there missed the shape the
 * model writes most often -- "May-Aug 2026" -- which then fell through to the
 * colon rule and read "May: Aug 2026". A proper noun still fails the lookbehind,
 * so "**Animarker** - May 2023" stays a separator.
 */
const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
/*
 * The word boundary keeps a month from matching the end of an ordinary word:
 * "the summary - 2025" was read as "Mar" + "y" and became a range.
 */
const DATE_BEFORE = `\\b(?:(?:${MONTH})[a-z]*\\.?(?:\\s+\\d{4})?|\\d{4})`;
/**
 * The right side must accept a full month name and the open-ended words a range ends
 * with. Reading only three-letter abbreviations turned "May - August 2026" into
 * "May: August 2026" and left "May 2026: present" for the colon rule.
 */
const DATE_AFTER = `(?:(?:${MONTH})[a-z]*\\.?|\\d{4}|present|now|today|current)\\b`;
const DATE_RANGE = new RegExp(`(?<=${DATE_BEFORE}) *[${DASH_RANGE}] *(?=${DATE_AFTER})`, "gi");
/**
 * Shorthand such as "2024-25" is written with a hyphen. The right side is two
 * digits, so the date-range rule does not accept it and the colon rule turned it
 * into "2024: 25".
 */
const COMPACT_YEAR_RANGE = new RegExp(`(?<=\\d{4}) *[${DASH_RANGE}] *(?=\\d{2}\\b)`, "g");
/** Remaining em dashes and horizontal bars read as a comma. */
const EM_DASH = new RegExp(` *[\\u2014\\u2015] *`, "g");
/** Remaining en dashes read as a colon, which is how they are used mid-sentence. */
const EN_DASH = / *\u2013 */g;
/** Hyphen look-alikes, including the non-breaking hyphen, become plain hyphens. */
const HYPHEN_LIKE = /[\u2010\u2011\u2012]/g;

/**
 * A dash opening a line is a bullet. The line break is captured rather than
 * anchored with ^, because a streamed slice can begin mid-line and match an
 * anchor it has no right to.
 */
const LIST_DASH = new RegExp(`(^|\\n)( *)[${DASH_RANGE}]( *)`, "g");

function replaceListDashes(text: string, atLineStart: boolean): string {
  return text.replace(LIST_DASH, (match, lead: string) =>
    lead === "" && !atLineStart ? match : `${lead}- `,
  );
}

export function sanitizeDashes(text: string, atLineStart = true): string {
  const normalized = text.replace(EXOTIC_SPACE, " ").replace(ZERO_WIDTH_SPACE, "");

  return replaceListDashes(normalized, atLineStart)
    .replace(COMPACT_YEAR_RANGE, "-")
    .replace(DATE_RANGE, " to ")
    .replace(EM_DASH, ", ")
    .replace(EN_DASH, ": ")
    .replace(HYPHEN_LIKE, "-");
}

const DASH_CHAR = new RegExp(`[${DASH_RANGE}]`);
const WORD_CHAR = /[\p{L}\p{N}]/u;
const EXOTIC_SPACE_CHAR = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b]/;

/** A space, an exotic space or a dash cannot be the last thing sent. */
function needsLookahead(char: string): boolean {
  return char === " " || char === "\t" || DASH_CHAR.test(char) || EXOTIC_SPACE_CHAR.test(char);
}

/** A cut moved back until nothing that needs lookahead is left dangling. */
function safeCut(text: string, cut: number): number {
  let index = Math.max(0, Math.min(cut, text.length));
  while (index > 0 && needsLookahead(text[index - 1])) index -= 1;
  return index;
}

/** Where the token ending at `index` begins, so it can stay back with the dash. */
function tokenStartBefore(text: string, index: number): number {
  let start = index;
  while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
  return start;
}

/**
 * Index just past the word following a dash, or -1 while that word may still be
 * arriving. A word that runs to the end of the buffer waits for one more
 * character, which is what makes a streamed answer identical to the whole one.
 */
function endOfWordAfter(text: string, from: number): number {
  let index = from;

  while (index < text.length && !WORD_CHAR.test(text[index])) {
    // A line break settles it: no word is coming, so the dash reads as a colon.
    if (text[index] === "\n") return index + 1;
    index += 1;
  }

  if (index >= text.length) return -1;

  while (index < text.length && WORD_CHAR.test(text[index])) index += 1;
  return index < text.length ? index : -1;
}

/** Streams text through sanitizeDashes while keeping an unresolved tail. */
export class DashFilter {
  private held = "";
  /** Whether the next character really does start a line, in the whole answer. */
  private atLineStart = true;

  /** Returns the text that is safe to send now, which may be empty. */
  push(text: string): string {
    this.held += text;

    const dash = this.held.search(DASH_CHAR);
    if (dash !== -1) {
      const end = endOfWordAfter(this.held, dash + 1);
      if (end !== -1) return this.release(end);

      // The dash is not decidable yet. Keep the word before it too: a range needs
      // a date on the left of the dash, and "Animarker - May 2023" has none.
      const before = tokenStartBefore(this.held, safeCut(this.held, dash));
      return before > 0 ? this.release(before) : "";
    }

    const cut = safeCut(this.held, this.held.length - HELD_CHARS);
    return cut > 0 ? this.release(cut) : "";
  }

  /** The tail, once the answer is complete. */
  flush(): string {
    return this.release(this.held.length);
  }

  private release(cut: number): string {
    const emit = sanitizeDashes(this.held.slice(0, cut), this.atLineStart);
    this.held = this.held.slice(cut);
    if (emit.length > 0) this.atLineStart = emit.endsWith("\n");
    return emit;
  }
}
