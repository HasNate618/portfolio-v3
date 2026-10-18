import { withTopicPins } from "./context";
import { routeIntent } from "./intent";
import type { Intent } from "./intent";
import { namedSubjectId } from "./name-match";
import { availabilityAsked, choosePointer, contactAsked } from "./pointer";
import type { Pointer } from "./pointer";
import { buildProfileCard } from "./profile-card";
import { applyScoreFloor, rerankChunks, retrieveRelevantChunks } from "./rag";
import { buildRetrievalQuery } from "./retrieval-query";
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
