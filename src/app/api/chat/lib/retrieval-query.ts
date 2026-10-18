import { namedSubjectId, subjectDisplayName } from "./name-match";

interface HistoryMessage {
  role: string;
  content: string;
}

/** Words that point at the previous turn instead of naming a subject themselves. */
const PRONOUN = /\b(it|that|this|those|these)\b/i;

/** The first bold name in an answer, which is how the card and the answers name a subject. */
function boldName(text: string): string | null {
  return /\*\*([^*\n]{2,60})\*\*/.exec(text)?.[1]?.trim() ?? null;
}

/**
 * The subject the previous turn was about, spelled as a visitor would.
 *
 * Both turns are searched, because a visitor can open with "What are his strongest
 * projects?" and be answered about a project the question never named.
 */
function previousSubject(history: HistoryMessage[]): string | null {
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const lastAssistant = [...history].reverse().find((m) => m.role === "assistant")?.content ?? "";

  const id = namedSubjectId(`${lastUser}\n${lastAssistant}`);
  if (id) return subjectDisplayName(id);

  return boldName(lastAssistant);
}

function expandWithHistory(trimmed: string, history: HistoryMessage[]): string {
  if (history.length === 0) return trimmed;

  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content;
  const lastAssistant = [...history]
    .reverse()
    .find((m) => m.role === "assistant")
    ?.content
    ?.slice(0, 400);

  if (!lastUser || !lastAssistant) return trimmed;

  const looksContextual =
    trimmed.length < 80 ||
    /\b(it|that|this|those|these|they|he|his|there|which|what about)\b/i.test(trimmed);

  if (!looksContextual) return trimmed;

  return [
    "Previous user question:",
    lastUser,
    "Previous answer summary:",
    lastAssistant,
    "New question:",
    trimmed,
  ].join("\n");
}

/**
 * Expand the retrieval query with recent thread context so follow-ups
 * like "which features did he design?" still retrieve the right project.
 *
 * The subject goes first because the embedding weighs the opening most, and
 * "What models does it run?" is close to nothing on its own. A question that names
 * its own subject is left alone: it does not need the previous one, and prefixing
 * would retrieve the wrong project against the visitor's own words.
 */
export function buildRetrievalQuery(
  message: string,
  history: HistoryMessage[],
): string {
  const trimmed = message.trim();
  const expanded = expandWithHistory(trimmed, history);

  if (history.length === 0) return expanded;
  if (!PRONOUN.test(trimmed)) return expanded;
  if (namedSubjectId(trimmed)) return expanded;

  const subject = previousSubject(history);
  return subject ? `${subject}: ${expanded}` : expanded;
}
