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

/**
 * Exported so the wording can be tested without a model call.
 *
 * The last three rules come from one live run, which offered "What projects did
 * Nathan work on at Microsoft?" (he has never worked there), "How does Nathan's
 * Cyberdeck project work?" (abandoned) and "What was Nathan's role in the
 * AGNTOS project?" (the project is AgntOS, and the answer was a refusal).
 */
export function buildFollowupPrompt(input: GenerateFollowupsInput): string {
  const { userMessage, aiResponse, chunkSources = [], history = [] } = input;

  const askedBefore = history
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n");

  const sources =
    chunkSources.length > 0
      ? chunkSources.slice(0, 6).join(", ")
      : "general portfolio knowledge";

  return `Suggest follow-up questions for a chat about Nathan Espejo's portfolio.

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
- About Nathan's projects, skills, or experience. Refer to him in third person (he/his/Nathan)
- Never ask about the chatbot or "you". For example, "What languages does Nathan know?", not "What languages do you know?"
- Prefer what a recruiter would ask next: what he built, how it works, what came of it, or how to contact him
- On team projects, ask what the team built, not what he personally built
- Only name companies, projects and people that appear in the answer excerpt or the related sources. Never introduce an organisation that is not there
- Spell names exactly as the sources do: TeraGo, AWARE, AgntOS, Animarker
- Do not ask how an abandoned project works, and do not ask about something the answer says is not in the record
- Never use em dashes
- Do not repeat questions already asked in this thread`;
}

export async function generateFollowups(input: GenerateFollowupsInput): Promise<string[]> {
  const { userMessage, aiResponse } = input;
  const prompt = buildFollowupPrompt(input);

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
