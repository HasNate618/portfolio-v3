import { pointerWhitelist } from "./pointer";
import { buildProfileCard } from "./profile-card";
import type { ChatDocument } from "./pipeline";

/**
 * What an answer claims that the record cannot back.
 *
 * The prompt tells the model to use only what the card and the documents hold, and
 * mostly it does. These are the two places where a mistake is both invisible and
 * checkable: a number, which a reader has no way to verify, and a URL, which a reader
 * can click. The check logs and never blocks: a false positive must not cost a
 * visitor their answer, and the model is right far more often than this is.
 */

export interface AnswerCheckInput {
  text: string;
  card: string;
  documents: Array<{ snippet: string }>;
  whitelist: string[];
}

export interface AnswerCheckResult {
  /** Numbers in the answer that appear nowhere in the card or the documents. */
  numbersMissing: string[];
  /** URLs in the answer that are not on the site's own list. */
  urlsMissing: string[];
}

/** A number as an answer writes it: 308, 84.2%, 1,200. */
const NUMBER = /\d[\d,]*(?:\.\d+)?%?/g;

/** A URL or mailto, stopping at the whitespace or bracket around it. */
const URL_PATTERN = /(?:https?:\/\/|mailto:)[^\s)\]]+/g;

/** A bare email address, which is what an answer writes for the pointer. */
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.]+/g;

/**
 * Every URL or email in the text, as a reader would recognize them: trailing sentence
 * punctuation removed, `mailto:` normalized away, duplicates collapsed.
 *
 * The whitelist holds both `mailto:nate@…` and `nate@…`, so counting whitelist entries
 * that appear in a paragraph counted one pointer twice. Counting the URLs the text
 * actually contains cannot do that.
 */
export function urlsIn(text: string): string[] {
  const found = [...(text.match(URL_PATTERN) ?? []), ...(text.match(EMAIL_PATTERN) ?? [])];
  return [
    ...new Set(
      found.map((url) => url.replace(/[.,;:!?]+$/, "")).map((url) => url.replace(/^mailto:/, "")),
    ),
  ];
}

/** True when the URL is one the site serves or links. */
export function isWhitelisted(url: string, whitelist: string[]): boolean {
  const bare = url.replace(/^mailto:/, "");
  return whitelist.some((allowed) => {
    const allowedBare = allowed.replace(/^mailto:/, "");
    return bare === allowedBare || bare.startsWith(allowedBare) || url.startsWith(allowed);
  });
}

export function answerChecks(input: AnswerCheckInput): AnswerCheckResult {
  const source = [input.card, ...input.documents.map((doc) => doc.snippet)].join("\n");

  const numbers = input.text.match(NUMBER) ?? [];
  const numbersMissing = [...new Set(numbers.filter((number) => !source.includes(number)))];

  const urls = urlsIn(input.text);
  const urlsMissing = [...new Set(urls.filter((url) => !isWhitelisted(url, input.whitelist)))];

  return { numbersMissing, urlsMissing };
}

/**
 * Logs the check for one finished answer. Never throws, and never logs the answer
 * itself: only what is wrong with it.
 */
export function logAnswerChecks(text: string, documents: ChatDocument[]): void {
  try {
    const result = answerChecks({
      text,
      card: buildProfileCard(),
      documents: documents.map((doc) => ({ snippet: doc.data.snippet })),
      whitelist: pointerWhitelist(),
    });

    if (result.numbersMissing.length > 0 || result.urlsMissing.length > 0) {
      console.info("[chat-check]", JSON.stringify(result));
    }
  } catch (error) {
    console.error("[chat-check] failed", error);
  }
}
