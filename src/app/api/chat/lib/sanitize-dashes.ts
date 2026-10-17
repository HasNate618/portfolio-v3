/**
 * Dashes, made deterministic.
 *
 * Rule 14 asks the model for commas, colons and plain hyphens. One live answer
 * still shipped an em dash, en dashes as separators ("**Campus** \u2013 his...")
 * and U+2011 non-breaking hyphens inside words like "self-hosted", which also
 * break copy and search. A rule that has already failed once does not get to be
 * the only defence, so the answer is cleaned as it streams.
 *
 * Every replacement is decided by what follows the dash, never by what precedes
 * it. That is a streaming constraint rather than a style choice: a chunk can
 * split right at the dash, so the text on the left may already have been sent
 * and cannot be consulted.
 *
 * The filter therefore does two things. It holds a short tail, so a dash that
 * arrives split across two chunks is still seen with a character after it. And
 * when it does hold a dash, it waits for the whole word that follows, because
 * "2026 \u2013 20" would read as a colon and only become " to " once the rest of
 * "2025" landed, showing the visitor both. Waiting for one word is cheap; the
 * alternative is text that changes under the reader.
 */

/** Tail held while no dash is pending. A few characters of latency. */
const HELD_CHARS = 24;

/** Horizontal space only. A newline has to survive: it may be a list break. */
const SPACE = "[ \\t]*";

/** A dash before a month or a four-digit year is a date range: "May 2026 to Aug 2026". */
const DATE_RANGE =
  /[ \t]*[\u2013\u2014][ \t]*(?=(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\d{4}\b)/gi;
/** Remaining em dashes read as a comma. */
const EM_DASH = new RegExp(`${SPACE}\\u2014${SPACE}`, "g");
/** Remaining en dashes read as a colon, which is how they are used mid-sentence. */
const EN_DASH = new RegExp(`${SPACE}\\u2013${SPACE}`, "g");

/**
 * A dash opening a line is a bullet. The line break is captured rather than
 * anchored with ^, because a streamed slice can begin mid-line and match an
 * anchor it has no right to.
 */
const LIST_DASH = /(^|\n)([ \t]*)[\u2013\u2014]([ \t]*)/g;

function replaceListDashes(text: string, atLineStart: boolean): string {
  return text.replace(LIST_DASH, (match, lead: string) =>
    lead === "" && !atLineStart ? match : `${lead}- `,
  );
}

export function sanitizeDashes(text: string, atLineStart = true): string {
  return replaceListDashes(text, atLineStart)
    .replace(DATE_RANGE, " to ")
    .replace(EM_DASH, ", ")
    .replace(EN_DASH, ": ")
    .replace(/\u2011/g, "-");
}

const DASH_CHAR = /[\u2013\u2014]/;
const WORD_CHAR = /[\p{L}\p{N}]/u;

/** A space or a dash cannot be the last thing sent: both need what follows. */
function needsLookahead(char: string): boolean {
  return char === " " || char === "\t" || DASH_CHAR.test(char);
}

/** A cut moved back until nothing that needs lookahead is left dangling. */
function safeCut(text: string, cut: number): number {
  let index = Math.max(0, Math.min(cut, text.length));
  while (index > 0 && needsLookahead(text[index - 1])) index -= 1;
  return index;
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

      // The dash is not decidable yet. What comes before it still is, as long as
      // the space that belongs to the dash stays behind with it.
      const before = safeCut(this.held, dash);
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
