import { CohereClient } from "cohere-ai";

let client: CohereClient | null = null;

/** Primary chat model for main responses. */
export const CHAT_MODEL = "command-a-plus-05-2026";

/** Fast model for follow-up suggestions — avoids command-a JSON/tool issues. */
export const FOLLOWUP_MODEL = "command-r-plus-08-2024";

/** Total generation budget — must be >= thinking tokenBudget. */
export const CHAT_MAX_TOKENS = 12000;

/** Reasoning enabled for main chat — thinking tokens are filtered from the stream. */
export const CHAT_THINKING_ENABLED = {
  type: "enabled" as const,
  tokenBudget: 5000,
};

/** Followups are short JSON — skip reasoning for latency. */
export const CHAT_THINKING_DISABLED = { type: "disabled" as const };

export function getCohereClient(): CohereClient {
  if (!client) {
    client = new CohereClient({ token: process.env.COHERE_API_KEY });
  }
  return client;
}

/**
 * Embedding identity. The document index and the query MUST use the same model
 * and dimension: if they diverge, cosine similarity compares vectors from two
 * different spaces and retrieval degrades silently instead of failing. Both
 * paths go through embedTexts() so that cannot happen by accident, and the
 * model is part of the cache hash so swapping it invalidates the index.
 */
export const EMBED_MODEL = "embed-v5.0-pro";
export const EMBED_DIMENSION = 1024;

export async function embedTexts(
  texts: string[],
  inputType: "search_document" | "search_query"
): Promise<number[][]> {
  const response = await getCohereClient().v2.embed({
    texts,
    model: EMBED_MODEL,
    inputType,
    outputDimension: EMBED_DIMENSION,
    embeddingTypes: ["float"],
  });

  const vectors = response.embeddings.float;

  // A short response would silently misalign vectors with their source text.
  if (!vectors || vectors.length !== texts.length) {
    throw new Error(`embed returned ${vectors?.length ?? 0} vectors for ${texts.length} texts`);
  }

  return vectors;
}

export const MAX_CHAT_MESSAGE_LENGTH = 4000;
