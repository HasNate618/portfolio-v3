import { DashFilter } from "./sanitize-dashes";
import { BannedPhraseFilter } from "./banned-phrases";
import { RepeatGuard } from "./repeat-guard";

/**
 * A Cohere stream event, as far as this module needs it. The SDK types the stream
 * as a union of event shapes, and the non-content ones carry a delta this has no
 * use for, so the delta stays unknown and is narrowed below.
 */
export interface AnswerDelta {
  type: string;
  delta?: unknown;
}

interface VisibleContent {
  text: string;
  thinking: boolean;
}

/** The content of a content-delta, or null for every other event type. */
function visibleContent(delta: unknown): VisibleContent | null {
  if (typeof delta !== "object" || delta === null) return null;

  const message = (delta as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;

  const content = (message as { content?: unknown }).content;
  if (typeof content !== "object" || content === null) return null;

  const { text, thinking } = content as { text?: unknown; thinking?: unknown };
  if (typeof text !== "string") return null;

  return { text, thinking: thinking === true };
}

export interface StreamAnswerOptions {
  /** Starts one attempt. Called again for the retry. */
  start: () => Promise<AsyncIterable<AnswerDelta>>;
  /** Called with each piece of visible text, in order. */
  emit: (text: string) => void;
  /** Called as the answer grows, for work that can start before it finishes. */
  onProgress?: (visible: string) => void;
  /** True once the consumer is gone or the request is aborted. */
  stopped?: () => boolean;
  /** Visible characters allowed before the answer is cut. */
  maxChars?: number;
  /** Model calls allowed, including the first. */
  attempts?: number;
}

export interface AnswerResult {
  /** The visible, dash-filtered answer. */
  text: string;
  /** How many model calls it took. */
  attempts: number;
  /** Whether an empty answer was tried again. */
  retried: boolean;
  /** Whether the answer was cut at maxChars. */
  truncated: boolean;
}

export const MAX_ANSWER_CHARS = 6000;
export const ANSWER_ATTEMPTS = 2;

/**
 * Whether another attempt could help.
 *
 * 422 is Cohere saying it produced nothing usable, which is the transient shape of a
 * thinking-only generation and is worth one more try. 5xx is the service failing. A 400
 * is our bug, and retrying it would only hide it: the document-id rejection was a 400,
 * and swallowing that would have turned a loud failure into a blank answer.
 */
export function isRetryable(error: unknown): boolean {
  const status = (error as { statusCode?: number } | null)?.statusCode;
  return status === 422 || (typeof status === "number" && status >= 500);
}

/**
 * Streams one visible answer, retrying once when the model returns nothing visible.
 *
 * Roughly one live call in twelve comes back carrying only reasoning tokens: HTTP
 * 200, an empty body, and follow-up chips sitting under a blank answer. Nothing has
 * been sent at that point, so a second attempt costs the visitor nothing and is
 * invisible to them. Disabling thinking is not the fallback: with thinking off this
 * model writes its reasoning into the answer, which one measured run did for 3,005
 * characters ("We need to answer: ... Proceed.").
 *
 * The dash filter lives here because a retry has to start from a clean one, and
 * because the filter holds a short tail that must be released before anyone can
 * judge the answer finished.
 */
export async function streamAnswer(options: StreamAnswerOptions): Promise<AnswerResult> {
  const maxChars = options.maxChars ?? MAX_ANSWER_CHARS;
  const limit = Math.max(1, options.attempts ?? ANSWER_ATTEMPTS);
  const stopped = options.stopped ?? (() => false);

  let attempts = 0;
  let text = "";
  let truncated = false;

  for (let attempt = 1; attempt <= limit; attempt += 1) {
    attempts = attempt;
    text = "";
    let chars = 0;
    const filter = new DashFilter();
    const phrases = new BannedPhraseFilter();
    const repeats = new RepeatGuard();

    try {
      const source = await options.start();

      for await (const chunk of source) {
        if (stopped()) break;
        if (chunk.type !== "content-delta") continue;

        const content = visibleContent(chunk.delta);
        if (!content || content.thinking) continue;

        const delta = content.text;
        const room = maxChars - chars;
        if (room <= 0) {
          truncated = true;
          break;
        }

        const accepted = delta.length > room ? delta.slice(0, room) : delta;
        if (accepted.length < delta.length) truncated = true;
        chars += accepted.length;

        const safe = phrases.push(repeats.push(filter.push(accepted)));
        if (safe) {
          text += safe;
          options.emit(safe);
          options.onProgress?.(text);
        }

        /*
         * A looping answer is cut like a long one: the visitor keeps everything up to
         * the repeat, and no further tokens are pulled from the model. The chips still
         * run, so a truncated answer is not a dead end.
         */
        if (repeats.aborted) {
          truncated = true;
          break;
        }
      }
    } catch (error) {
      /*
       * A generation that fails outright is the same situation as one that returns
       * nothing visible, but only while nothing has been shown: once the visitor has
       * text, a retry would show it again. Anything a retry cannot fix is rethrown so
       * it stays visible instead of becoming a blank answer.
       */
      if (attempt === limit || text.trim().length > 0 || !isRetryable(error)) throw error;
      console.warn(`Chat generation failed on attempt ${attempt}:`, error);
    } finally {
      /*
       * Each filter holds a short tail, so the answer is not finished until all three
       * are empty. Order matters: dashes first, then the repeat guard, then the phrase
       * filter, so the guard judges finished wording and the phrase filter sees the
       * text that actually ships.
       */
      const guardTail = repeats.push(filter.flush()) + repeats.flush();
      const tail = phrases.push(guardTail) + phrases.flush();
      if (tail) {
        text += tail;
        options.emit(tail);
        options.onProgress?.(text);
      }

      if (phrases.removed > 0) {
        console.warn(`Chat stripped ${phrases.removed} banned phrase(s) from the answer`);
      }
    }

    if (text.trim().length > 0 || attempt === limit || stopped()) break;

    console.warn(`Chat returned no visible answer; retrying (attempt ${attempt + 1} of ${limit})`);
  }

  return { text, attempts, retried: attempts > 1, truncated };
}
