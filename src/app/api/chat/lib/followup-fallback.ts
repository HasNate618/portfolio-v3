/**
 * The lines the chat page opens with. `content/chat.md` carries the same four,
 * and a test holds the two together, because this list is what a failed answer
 * falls back to.
 */
export const STARTERS = [
  "What does Nathan build?",
  "What did Nathan build at TeraGo?",
  "What are Nathan's strongest projects?",
  "Is Nathan looking for a Summer 2027 internship?",
] as const;

/**
 * Shown when the answer is not an answer: a refusal, the injection line, or the
 * "couldn't find that" fallback. Generated questions in those cases asked the
 * visitor to follow up on facts the chat had just said it did not have.
 */
export const DEFAULT_FOLLOWUPS: string[] = STARTERS.slice(0, 3);

/** The three fixed bodies from the refusal, injection and not-found rules. */
const NON_ANSWER_PATTERNS = [
  /couldn['\u2019]?t find that/i,
  /could not find that/i,
  /that instruction does not apply/i,
  /i only answer questions about nathan/i,
  /*
   * v4 asks for "the record doesn't cover it" instead of a fixed line, so the
   * patterns follow the wording it asks for. The consequence of a miss is only
   * which three questions a refusal ends with.
   */
  /record (doesn['\u2019]?t|does not) cover/i,
  /(isn['\u2019]?t|is not|not) (in|covered by|part of) the record/i,
];

/** True when the body is one of the fixed lines rather than an answer about Nathan. */
export function isNonAnswer(body: string): boolean {
  return NON_ANSWER_PATTERNS.some((pattern) => pattern.test(body));
}
