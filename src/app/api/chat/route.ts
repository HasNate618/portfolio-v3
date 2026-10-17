import { retrieveRelevantChunks, rerankChunks } from "./lib/rag";
import { buildRetrievalQuery } from "./lib/retrieval-query";
import { buildSystemPrompt } from "./lib/system-prompt";
import { withCoverageFloor } from "./lib/context";
import { generateFollowups, formatFollowupsTail } from "./lib/generate-followups";
import { buildFallbackFollowups, DEFAULT_FOLLOWUPS, isNonAnswer } from "./lib/followup-fallback";
import { checkChatDailyCap, checkRateLimit, SITE_KEY } from "./lib/rate-limit";
import { MAX_BODY_CHARS, isBrowserRequest, trimHistory } from "./lib/request-guards";
import { sanitizeDashes } from "./lib/sanitize-dashes";
import { streamAnswer } from "./lib/stream-answer";
import { getCohereClient, MAX_CHAT_MESSAGE_LENGTH, CHAT_MODEL, CHAT_MAX_TOKENS, CHAT_THINKING_ENABLED } from "./lib/cohere";
import { FOLLOWUP_DELIMITER, stripBodyPrefix } from "@/lib/tts/stream-delimiters";

interface ChatHistoryMessage {
  role: string;
  content: string;
}

/**
 * The follow-up prompt only reads the first 600 characters of the answer, so the
 * call can start as soon as there is a few hundred and run alongside the rest of
 * the answer instead of after it.
 */
const FOLLOWUP_START_CHARS = 400;

/**
 * The questions are a nicety; the answer is the product. Cap the wait and fall
 * back to the local questions rather than holding the stream open — an unusually
 * slow follow-up call used to prolong every answer by however long it took.
 */
const FOLLOWUP_TIMEOUT_MS = 6000;

function withinFollowupBudget(
  pending: Promise<string[]>,
  fallback: () => string[]
): Promise<string[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<string[]>((resolve) => {
    timer = setTimeout(() => resolve(fallback()), FOLLOWUP_TIMEOUT_MS);
  });
  return Promise.race([pending.catch(fallback), timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export async function POST(req: Request) {
  try {
    /*
     * The chat is for browsers on this site. Machines get /api/search: the same
     * retrieval, no generation, a hundredth of the cost. Headers can be forged,
     * so this is a speed bump rather than a wall, and its purpose is to make the
     * cheap path the documented one rather than to keep a secret.
     */
    if (!isBrowserRequest(req.headers, req.headers.get("host"))) {
      return jsonResponse(
        { error: "The chat is for browsers on this site. Use /api/search for machine access." },
        403,
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const hourly = checkRateLimit(ip);
    if (!hourly.allowed) {
      return jsonResponse({ error: "Rate limit exceeded" }, 429, {
        "Retry-After": String(hourly.retryAfter),
      });
    }

    const daily = checkChatDailyCap(SITE_KEY);
    if (!daily.allowed) {
      return jsonResponse({ error: "Daily limit reached" }, 429, {
        "Retry-After": String(daily.retryAfter),
      });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) {
      return jsonResponse({ error: "Request body is too large" }, 413);
    }

    let payload: { message?: unknown; history?: unknown };
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      return jsonResponse({ error: "Body must be JSON" }, 400);
    }

    const { message } = payload;
    const history = Array.isArray(payload.history) ? (payload.history as ChatHistoryMessage[]) : [];

    if (!message || typeof message !== "string") {
      return jsonResponse({ error: "Message is required" }, 400);
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return jsonResponse({ error: "Message is required" }, 400);
    }

    if (trimmedMessage.length > MAX_CHAT_MESSAGE_LENGTH) {
      return jsonResponse(
        { error: `Message must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer` },
        400,
      );
    }

    const safeHistory = trimHistory(
      history.filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0),
    );
    const retrievalQuery = buildRetrievalQuery(trimmedMessage, safeHistory);

    const topChunks = await retrieveRelevantChunks(retrievalQuery, 30);
    const reranked = await rerankChunks(retrievalQuery, topChunks, 10);
    // Retrieval that comes back with no project and no role is how a broad
    // question turns into invented detail: the floor pins the work the home
    // page leads with, and only then.
    const context = withCoverageFloor(reranked);
    const systemPrompt = buildSystemPrompt(context);

    const cohere = getCohereClient();

    const startChatStream = () =>
      cohere.v2.chatStream({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...safeHistory.map((m) => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
          })),
          { role: "user", content: trimmedMessage },
        ],
        temperature: 0.2,
        maxTokens: CHAT_MAX_TOKENS,
        thinking: CHAT_THINKING_ENABLED,
      });

    const stream = await startChatStream();

    return new Response(
      new ReadableStream({
        async start(controller) {
          let closed = false;
          const encoder = new TextEncoder();

          const closeStream = () => {
            if (closed) return;
            closed = true;
            try {
              controller.close();
            } catch {
              // Consumer already gone.
            }
          };

          const enqueueText = (text: string) => {
            if (closed || !text) return;
            try {
              controller.enqueue(encoder.encode(text));
            } catch {
              closed = true;
            }
          };

          req.signal.addEventListener("abort", closeStream, { once: true });

          const followupInput = (visible: string) => ({
            userMessage: trimmedMessage,
            aiResponse: stripBodyPrefix(visible),
            chunkSources: context.map((c) => c.source),
            history: safeHistory,
          });

          /*
           * Started mid-answer, not after it. This is a second, unstreamed model
           * call, and waiting for the answer to finish before starting it is what
           * made the questions feel slow: the visitor paid for the whole answer,
           * then paid again for the questions.
           */
          let followupsPending: Promise<string[]> | null = null;

          // The first attempt is the stream already opened above; a retry opens a
          // new one, which is the only way an empty answer can be replaced without
          // the visitor seeing it replaced.
          let started = 0;
          const nextStream = async () => {
            started += 1;
            return started === 1 ? stream : startChatStream();
          };

          try {
            const result = await streamAnswer({
              start: nextStream,
              emit: enqueueText,
              onProgress: (visible) => {
                if (!followupsPending && visible.length >= FOLLOWUP_START_CHARS) {
                  followupsPending = generateFollowups(followupInput(visible));
                }
              },
              stopped: () => closed || req.signal.aborted,
            });

            const accumulated = result.text;

            if (!closed && !req.signal.aborted && !accumulated.includes(FOLLOWUP_DELIMITER)) {
              // The delimiter goes out first: it is what tells the client the
              // answer is finished, so the answer stops reading as in flight
              // while the questions are still being written.
              enqueueText(FOLLOWUP_DELIMITER);
              const body = stripBodyPrefix(accumulated);
              // A refusal or a "couldn't find that" answer has nothing to follow
              // up on, and asking the model anyway produced questions about a
              // company he never worked at.
              const followups = isNonAnswer(body)
                ? DEFAULT_FOLLOWUPS
                : await withinFollowupBudget(
                    followupsPending ?? generateFollowups(followupInput(accumulated)),
                    () => buildFallbackFollowups(trimmedMessage, body)
                  );
              enqueueText(sanitizeDashes(formatFollowupsTail(followups)));
            }

            closeStream();
          } catch (err) {
            if (!closed) {
              console.error("Stream error:", err);
              try {
                controller.error(err);
              } catch {
                // Consumer already gone.
              }
              closed = true;
            }
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return jsonResponse({ error: "Failed to process request" }, 500);
  }
}
