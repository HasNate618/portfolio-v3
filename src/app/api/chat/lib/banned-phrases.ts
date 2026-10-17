/**
 * Phrases the site never uses, deleted on the way out.
 *
 * Live answers kept calling Campus "a mature, production-grade tool" after rule
 * 19 named the phrase. A wording habit is the wrong thing to fight with a rule:
 * rules are advisory and this one was already ignored. Deleting the phrase is safe
 * where the sentence-level claim filter the planners designed was not, because no
 * line in the site copy uses either phrase, so there is no true sentence to damage.
 *
 * Same streaming constraint as the dash filter: a chunk can split inside
 * "production-grade", and the separator that introduces the phrase has to still be
 * in hand when it is deleted, so an unfinished phrase is held rather than sent.
 */

/**
 * The phrases, each with the pattern that says a complete one may still be
 * followed by the comma that belongs to it.
 */
const BANNED = [
  { phrase: "production-grade", pending: /\bproduction-grade[,\s]*$/i },
  { phrase: "production-ready", pending: /\bproduction-ready[,\s]*$/i },
];

/** A phrase, with the comma and whitespace that introduce or follow it. */
const PHRASE = /\s*(?:,\s*)?\bproduction-(?:grade|ready)\b(?:,\s*)?/gi;

export function stripBannedPhrases(text: string): string {
  return text.replace(PHRASE, "");
}

/**
 * The tail that cannot be decided yet: an unfinished banned phrase, or a complete
 * one whose following comma and space may still be on their way.
 */
function pendingPhrase(text: string): string {
  const lower = text.toLowerCase();

  for (const { phrase, pending } of BANNED) {
    // A complete phrase, plus any separator already in hand after it.
    const complete = pending.exec(lower);
    if (complete) return text.slice(complete.index);

    // An unfinished phrase, which must never be emitted.
    for (let length = Math.min(phrase.length - 1, lower.length); length > 0; length -= 1) {
      if (lower.endsWith(phrase.slice(0, length))) return text.slice(text.length - length);
    }
  }
  return "";
}

export class BannedPhraseFilter {
  private held = "";

  /** How many phrases were removed, so the route can log one line per answer. */
  removed = 0;

  push(text: string): string {
    this.held += text;

    const phrase = pendingPhrase(this.held);
    const before = this.held.slice(0, this.held.length - phrase.length);
    // The separator stays with a pending phrase: if it were sent, the deletion
    // would leave "a mature, tool" behind.
    const separator = /(?:,|\s)+$/.exec(before)?.[0] ?? "";

    // With nothing pending, hold trailing whitespace, so the next chunk can still
    // decide whether a phrase follows it.
    const hold = phrase ? separator + phrase : separator;

    const emit = this.held.slice(0, this.held.length - hold.length);
    this.held = hold;
    return this.strip(emit);
  }

  flush(): string {
    const out = this.strip(this.held);
    this.held = "";
    return out;
  }

  private strip(text: string): string {
    const removed = text.match(PHRASE)?.length ?? 0;
    if (removed === 0) return text;

    this.removed += removed;
    return stripBannedPhrases(text);
  }
}
