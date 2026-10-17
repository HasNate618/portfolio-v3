import { MAX_CHAT_MESSAGE_LENGTH } from "./cohere";

/** Message history the server will accept. Older turns are dropped, not refused. */
export const MAX_HISTORY_MESSAGES = 30;
export const MAX_HISTORY_CHARS = 16000;
/** A body larger than this is refused before it is parsed. */
export const MAX_BODY_CHARS = 100_000;

/**
 * True for a request that came from this site's own pages.
 *
 * Browsers mark their own fetches: Sec-Fetch-Site is sent on every fetch, and
 * Origin is sent on every POST, including same-origin ones. Both can be forged
 * by a script, so this is not a wall. It is the difference between the chat
 * being the open, documented machine interface and being a page on this site:
 * a crawler that wants facts is sent to /api/search, which is where the cheap
 * path is.
 */
export function isBrowserRequest(headers: Headers, host: string | null): boolean {
  const site = headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "same-site";

  // Safari before 16.4 sends no Sec-Fetch-*; the Origin header is the fallback.
  const origin = headers.get("origin");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * The most recent turns, inside both caps.
 *
 * Older messages are dropped rather than the request being refused: a long
 * conversation should keep working, and what matters for the next answer is the
 * recent context. A single over-long message is clipped to the same length the
 * message endpoint allows.
 */
export function trimHistory<T extends { content: string }>(history: T[]): T[] {
  const kept: T[] = [];
  let total = 0;

  for (let index = history.length - 1; index >= 0 && kept.length < MAX_HISTORY_MESSAGES; index -= 1) {
    const content = history[index].content.slice(0, MAX_CHAT_MESSAGE_LENGTH);
    if (total + content.length > MAX_HISTORY_CHARS) break;
    kept.unshift({ ...history[index], content });
    total += content.length;
  }

  return kept;
}
