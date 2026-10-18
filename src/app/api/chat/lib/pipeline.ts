import { withTopicPins } from "./context";
import { askedAboutAbandoned } from "./chips-validate";
import {
  CHAT_MAX_TOKENS,
  CHAT_MODEL,
  CHAT_TEMPERATURE,
  CHAT_THINKING_ENABLED,
  getCohereClient,
} from "./cohere";
import { generateChips } from "./generate-followups";
import type { ChipSource } from "./generate-followups";
import { routeIntent } from "./intent";
import type { Intent } from "./intent";
import { namedSubjectId } from "./name-match";
import { availabilityAsked, choosePointer, contactAsked } from "./pointer";
import type { Pointer } from "./pointer";
import { buildProfileCard } from "./profile-card";
import { applyScoreFloor, rerankChunks, retrieveRelevantChunks } from "./rag";
import { buildRetrievalQuery } from "./retrieval-query";
import { sanitizeDashes } from "./sanitize-dashes";
import { buildSystemPrompt } from "./system-prompt";
import { routeTopic } from "./topic";
import type { TopicRoute } from "./topic";

export interface ChatDocument {
  id: string;
  data: { title: string; snippet: string };
}

export interface HistoryEntry {
  role: string;
  content: string;
}

/** A chunk as retrieval and the topic pins hand it over. */
export interface ContextChunk {
  text: string;
  source: string;
  section?: string;
}

export interface PreparedChat {
  systemPrompt: string;
  documents: ChatDocument[];
  topic: TopicRoute;
  intent: Intent;
  pointer: Pointer;
}

/**
 * The record as Cohere `documents`.
 *
 * Keyed by source *and* section: keying by source alone would drop the retrieved
 * "Results" chunk whenever a topic pin for the same file was present, and the pin is
 * the summary while retrieval is the detail. The first copy of a key wins, and order
 * is preserved so the pins lead.
 */
export function toDocuments(chunks: ContextChunk[]): ChatDocument[] {
  const seen = new Set<string>();
  const documents: ChatDocument[] = [];

  for (const chunk of chunks) {
    const section = chunk.section || "body";
    const id = `${chunk.source}#${section}`;
    if (seen.has(id)) continue;

    seen.add(id);
    documents.push({ id, data: { title: `${chunk.source} > ${section}`, snippet: chunk.text } });
  }

  return documents;
}

/**
 * Everything the route needs before it opens a stream. It lives here so the eval can
 * run the same pipeline instead of a copy of it, which is the only way the eval's
 * numbers describe what visitors get.
 */
export async function prepareChat(
  message: string,
  history: HistoryEntry[],
): Promise<PreparedChat> {
  const lastUserTurn = [...history].reverse().find((entry) => entry.role === "user")?.content ?? "";
  const turn = history.filter((entry) => entry.role === "user").length + 1;

  /*
   * The question, read with the turn before it: a visitor who says "tell me more" is
   * still asking about the last subject. The topic decides what to lead with, the
   * intent decides whether to read the visitor as hiring, and the pointer is chosen
   * from the visitor's own words, because it is the line the answer ends with.
   */
  const topic = routeTopic(`${message} ${lastUserTurn}`);
  const intent = routeIntent(message, history);
  const pointer = choosePointer({
    namedSubjectId: namedSubjectId(message),
    intent,
    turn,
    contactAsked: contactAsked(message),
    availabilityAsked: availabilityAsked(message),
  });

  const retrievalQuery = buildRetrievalQuery(message, history);
  const topChunks = await retrieveRelevantChunks(retrievalQuery, { excludeNav: true, topK: 40 });
  const reranked = await rerankChunks(retrievalQuery, topChunks, 8);
  const chunks = withTopicPins(applyScoreFloor(reranked), message, topic.feature);

  return {
    systemPrompt: buildSystemPrompt({
      featureIds: topic.feature,
      intent,
      pointer,
      card: buildProfileCard(),
    }),
    documents: toDocuments(chunks),
    topic,
    intent,
    pointer,
  };
}

/** One scored turn of the eval. */
export interface ChatTurnResult {
  text: string;
  chips: string[];
  /** Where each chip came from, which is what the accept rate is computed from. */
  chipSources: ChipSource[];
  docs: ChatDocument[];
  citations: number;
  usage: { inputTokens: number; outputTokens: number } | null;
  latencyMs: number;
}

/** The text of an assistant message, ignoring any non-text part. */
function messageText(message: { content?: readonly unknown[] }): string {
  const content = message.content;
  if (!Array.isArray(content)) return "";

  return content
    .filter(
      (part): part is { type: string; text?: unknown } =>
        typeof part === "object" && part !== null && (part as { type?: unknown }).type === "text",
    )
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("");
}

/**
 * One full turn, non-streamed, so the eval can read the answer, the citations and the
 * usage. The route streams instead, but both go through `prepareChat`: an eval that ran
 * its own pipeline would measure a system nobody visits.
 */
export async function runChatTurn(
  message: string,
  history: HistoryEntry[],
): Promise<ChatTurnResult> {
  const started = Date.now();
  const prepared = await prepareChat(message, history);

  const response = await getCohereClient().v2.chat({
    model: CHAT_MODEL,
    messages: [
      { role: "system" as const, content: prepared.systemPrompt },
      ...history.map((entry) => ({
        role: entry.role === "user" ? ("user" as const) : ("assistant" as const),
        content: entry.content,
      })),
      { role: "user" as const, content: message },
    ],
    documents: prepared.documents,
    citationOptions: { mode: "FAST" },
    temperature: CHAT_TEMPERATURE,
    maxTokens: CHAT_MAX_TOKENS,
    thinking: CHAT_THINKING_ENABLED,
  });

  const text = sanitizeDashes(messageText(response.message));
  const askedBefore = history.filter((entry) => entry.role === "user").map((entry) => entry.content);

  const chips = await generateChips({
    userMessage: message,
    answer: text,
    docs: prepared.documents.map((doc) => ({
      title: doc.data.title,
      firstLine: doc.data.snippet.split("\n")[0]?.slice(0, 160) ?? "",
    })),
    featureIds: prepared.topic.feature,
    asked: [...askedBefore, message],
    userAskedAbandoned: askedAboutAbandoned(message),
    pathIndex: askedBefore.length,
  });

  const tokens = response.usage?.tokens;

  return {
    text,
    chips: chips.questions,
    chipSources: chips.sources,
    docs: prepared.documents,
    citations: response.message.citations?.length ?? 0,
    usage: tokens
      ? { inputTokens: tokens.inputTokens ?? 0, outputTokens: tokens.outputTokens ?? 0 }
      : null,
    latencyMs: Date.now() - started,
  };
}
