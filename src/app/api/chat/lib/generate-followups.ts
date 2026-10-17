import {
  getCohereClient,
  FOLLOWUP_MODEL,
} from "./cohere";
import { buildFallbackFollowups, normalizeFollowups } from "./followup-fallback";

export interface GenerateFollowupsInput {
  userMessage: string;
  aiResponse: string;
  chunkSources?: string[];
  history?: Array<{ role: string; content: string }>;
}

/**
 * The questions as the client parses them: `|||`-separated, trailing separator
 * included. Sent separately from the delimiter that precedes them, because the
 * delimiter goes out as soon as the answer is written while the questions may
 * still be a second away.
 */
export function formatFollowupsTail(followups: string[]): string {
  return `${followups.join("|||")}|||`;
}

function parseFollowupLines(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as { followups?: unknown };
    if (Array.isArray(parsed.followups)) {
      return parsed.followups.filter((q): q is string => typeof q === "string");
    }
  } catch {
    // plain text
  }

  return trimmed
    .split("\n")
    .map((line) => line.replace(/^\d+[\).\s-]+/, "").replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0 && line.endsWith("?"));
}

export async function generateFollowups(input: GenerateFollowupsInput): Promise<string[]> {
  const {
    userMessage,
    aiResponse,
    chunkSources = [],
    history = [],
  } = input;

  const askedBefore = history
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n");

  const sources =
    chunkSources.length > 0
      ? chunkSources.slice(0, 6).join(", ")
      : "general portfolio knowledge";

  const prompt = `Suggest follow-up questions for a chat about Nathan Espejo's portfolio.

User question: ${userMessage}
Assistant answer (excerpt): ${aiResponse.slice(0, 600)}
Related sources: ${sources}
Already asked in this thread:
${askedBefore.slice(0, 400) || "(none)"}

Write exactly 3 short follow-up questions the visitor could ask next about Nathan.
Rules:
- Under 10 words each
- Plain text only, each line ends with "?"
- One question per line, no numbering, no markdown
- About Nathan's projects, skills, or experience — refer to him in third person (he/his/Nathan)
- Never ask about the chatbot or "you" — e.g. "What languages does Nathan know?" not "What languages do you know?"
- Do not repeat questions already asked in this thread`;

  try {
    const cohere = getCohereClient();
    const response = await cohere.v2.chat({
      model: FOLLOWUP_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      maxTokens: 256,
    });

    const textContent = response.message.content?.find((c) => c.type === "text");
    const raw = textContent?.text ?? "";
    const parsed = parseFollowupLines(raw);
    return normalizeFollowups(parsed, userMessage, aiResponse);
  } catch (error) {
    console.warn("[followups] generation failed, using fallback:", error);
    return buildFallbackFollowups(userMessage, aiResponse);
  }
}
