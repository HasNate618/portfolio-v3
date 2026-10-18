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
import { ANSWER_ATTEMPTS, finalizeAnswer, isRetryable } from "./stream-answer";
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
    const id = `${chunk.source}#${idSafe(section)}`;
    if (seen.has(id)) continue;

    seen.add(id);
    documents.push({ id, data: { title: `${chunk.source} > ${section}`, snippet: chunk.text } });
  }

  return documents;
}

/**
 * Cohere rejects the entire request when a document id contains whitespace, and a
 * section is a heading somebody wrote: "Focus areas". Only the id is rewritten. The
 * title keeps the heading as written, because a person reads the title.
 */
function idSafe(section: string): string {
  return section.trim().replace(/[^A-Za-z0-9]+/g, "-");
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

/** One line for a failed call, instead of the SDK's whole response dump. */
function describeError(error: unknown): string {
  const e = error as {
    statusCode?: number;
    body?: { error_type?: string };
    message?: string;
  } | null;

  const status = e?.statusCode ? `status ${e.statusCode}` : "no status";
  const detail = e?.body?.error_type ?? e?.message;
  return detail ? `${status} ${detail}` : status;
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

  const request = () =>
    getCohereClient().v2.chat({
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

  /*
   * The same retry policy the stream uses, and for the same reason. Cohere answers a
   * thinking-only generation with 422 NO_VALID_RESPONSE_GENERATED, which is the
   * non-streamed shape of the empty answer that leaves a visitor looking at chips under
   * a blank space. Nothing has been shown at that point, so a second attempt is free.
   * Without this the eval would report a failure no visitor experiences.
   */
  let response: Awaited<ReturnType<typeof request>> | null = null;
  let text = "";

  for (let attempt = 1; attempt <= ANSWER_ATTEMPTS; attempt += 1) {
    try {
      response = await request();
      /*
       * The served text, not the raw text: a visitor's answer has been through the dash,
       * repeat and phrase filters, so the eval must judge what they would have read.
       */
      text = finalizeAnswer(messageText(response.message));
      if (text.trim().length > 0 || attempt === ANSWER_ATTEMPTS) break;
      console.warn(`[eval] no visible answer; retrying (attempt ${attempt + 1} of ${ANSWER_ATTEMPTS})`);
    } catch (error) {
      /*
       * The eval has to finish all twenty and report, so a failure is recorded rather
       * than thrown: a run that dies at question 18 tells you nothing about 19 and 20.
       * Only a retryable failure earns the second attempt, so a 400 stays a 400, and the
       * threshold table is what reports it.
       */
      if (attempt === ANSWER_ATTEMPTS || !isRetryable(error)) {
        console.warn(`[eval] generation failed (${describeError(error)}); recording an empty answer`);
        break;
      }
      console.warn(`[eval] generation failed (${describeError(error)}); retrying`);
    }
  }

  const askedBefore = history.filter((entry) => entry.role === "user").map((entry) => entry.content);

  const chips = await generateChips({
    userMessage: message,
    answer: text,    docs: prepared.documents.map((doc) => ({
      title: doc.data.title,
      firstLine: doc.data.snippet.split("\n")[0]?.slice(0, 160) ?? "",
    })),
    featureIds: prepared.topic.feature,
    asked: [...askedBefore, message],
    userAskedAbandoned: askedAboutAbandoned(message),
    pathIndex: askedBefore.length,
  });

  return {
    text,
    chips: chips.questions,
    chipSources: chips.sources,
    docs: prepared.documents,
    citations: response?.message.citations?.length ?? 0,
    usage: response?.usage?.tokens
      ? {
          inputTokens: response.usage.tokens.inputTokens ?? 0,
          outputTokens: response.usage.tokens.outputTokens ?? 0,
        }
      : null,
    latencyMs: Date.now() - started,
  };
}
