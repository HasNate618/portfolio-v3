/**
 * Words the site never uses on a surface someone reads.
 *
 * A wording habit is not something a prompt rule can hold. "flagship" survived a
 * style line, a rule and a review, and it was still published in four places:
 * two of them the bot surface, one of them the facts block the chat retrieves.
 * A checker is deterministic and fails the build instead of asking nicely.
 *
 * Two consumers, one list, so they cannot drift: `scripts/check-banned-words.mjs`
 * and the chip validator, which must reject a question that names a banned word.
 *
 * Patterns carry no `g` flag on purpose. `RegExp.test` is stateful with one, so a
 * shared global pattern would skip every other line and report a clean tree.
 */
export interface BannedWord {
  word: string;
  re: RegExp;
}

export const BANNED_WORD_PATTERNS: readonly BannedWord[] = [
  { word: "flagship", re: /\bflagship\b/i },
];
