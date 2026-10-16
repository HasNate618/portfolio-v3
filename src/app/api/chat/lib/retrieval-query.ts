interface HistoryMessage {
  role: string;
  content: string;
}

/**
 * Expand the retrieval query with recent thread context so follow-ups
 * like "which features did he design?" still retrieve the right project.
 */
export function buildRetrievalQuery(
  message: string,
  history: HistoryMessage[],
): string {
  const trimmed = message.trim();
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
