/**
 * Stops an answer that has started repeating itself.
 *
 * A looping model does not repeat a word, it repeats a *unit*: a line, a sentence, a
 * whole paragraph, over and over until the token budget runs out. The visitor watches
 * it happen, and the answer that arrives is the same sentence hundreds of times.
 *
 * Two rules, because the two shapes look different in practice. A line of 30
 * characters or more that comes back a third time is a loop; anything shorter is a
 * list bullet, a heading or a separator, and those legitimately repeat. A window of
 * 200 characters that appears twice is a loop even when the line breaks differ, which
 * is the case the line rule cannot see.
 *
 * The tail is held back rather than emitted, so a repeat is caught before the visitor
 * is shown it: the second copy is the last thing they see. `aborted` lets the caller
 * stop pulling from the model, and the guard releases nothing after that.
 */

/** Lines shorter than this repeat legitimately: bullets, headings, rules. */
const MIN_LINE_CHARS = 30;
/** The third occurrence is the loop: two can be a deliberate echo. */
const LINE_REPEATS = 3;
/** Long enough that an exact repeat of it is not coincidence. */
const WINDOW_CHARS = 200;

/**
 * Where the repeat starts, or null when there is none.
 *
 * Runs over the whole answer rather than the pending tail: two occurrences 400
 * characters apart are still a loop, and by then the earlier one has been released.
 */
function repeatStart(text: string): number | null {
  const lineStarts = new Map<string, number>();
  let index = 0;

  for (const line of text.split("\n")) {
    const start = index;
    index += line.length + 1;

    const trimmed = line.trim();
    if (trimmed.length < MIN_LINE_CHARS) continue;

    const seen = (lineStarts.get(trimmed) ?? 0) + 1;
    if (seen >= LINE_REPEATS) return start;
    lineStarts.set(trimmed, seen);
  }

  const firstSeen = new Map<string, number>();
  for (let i = 0; i + WINDOW_CHARS <= text.length; i += 1) {
    const window = text.slice(i, i + WINDOW_CHARS);
    const before = firstSeen.get(window);

    if (before === undefined) {
      firstSeen.set(window, i);
      continue;
    }

    /*
     * Only a window that recurs at least its own length later is a repeat. Text that
     * repeats every few characters, which any repeated block does, matches its own
     * neighbour at every offset; returning at the first such match cut the answer off
     * ten characters into the first copy.
     */
    if (i - before >= WINDOW_CHARS) return i;
  }

  return null;
}

export class RepeatGuard {
  /** Everything the model has produced, released or not. Bounded by the answer cap. */
  private text = "";
  /** How much of `text` has been handed back to the caller. */
  private released = 0;
  private looped = false;

  get aborted(): boolean {
    return this.looped;
  }

  push(chunk: string): string {
    if (this.looped) return "";

    this.text += chunk;
    const start = repeatStart(this.text);
    if (start !== null) {
      this.looped = true;
      return this.releaseTo(start);
    }

    // The last window stays back so a repeat can be seen before it is shown.
    const holdFrom = Math.max(this.released, this.text.length - WINDOW_CHARS);
    return this.releaseTo(holdFrom);
  }

  flush(): string {
    if (this.looped) return "";

    const start = repeatStart(this.text);
    if (start !== null) {
      this.looped = true;
      return this.releaseTo(start);
    }

    return this.releaseTo(this.text.length);
  }

  private releaseTo(index: number): string {
    const released = this.text.slice(this.released, index);
    this.released = index;
    return released;
  }
}
