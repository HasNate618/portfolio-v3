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

export const MAX_CHAT_MESSAGE_LENGTH = 4000;
