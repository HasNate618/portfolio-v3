import { retrieveRelevantChunks, rerankChunks } from "./lib/rag";
import { buildRetrievalQuery } from "./lib/retrieval-query";
import { buildSystemPrompt } from "./lib/system-prompt";
import { withCoverageFloor } from "./lib/context";
import { CHIP_FEATURE_DEFAULT, formatFollowupsTail, generateChips } from "./lib/generate-followups";
import { DEFAULT_FOLLOWUPS, isNonAnswer } from "./lib/followup-fallback";
import { askedAboutAbandoned } from "./lib/chips-validate";
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
    // page leads with, and only then. A question that names a project or a role
    // is specific, so it keeps the context retrieval chose for it.
    const context = withCoverageFloor(reranked, trimmedMessage);
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
              stopped: () => closed || req.signal.aborted,
            });

            const accumulated = result.text;

            if (!closed && !req.signal.aborted && !accumulated.includes(FOLLOWUP_DELIMITER)) {
              enqueueText(FOLLOWUP_DELIMITER);
              const body = stripBodyPrefix(accumulated);
              const askedBefore = safeHistory
                .filter((m) => m.role === "user")
                .map((m) => m.content);
              /*
               * The visitor's own question is in `asked` as well: a chip that
               * repeats it is the likeliest duplicate of all. pathIndex stays on
               * the questions asked before this one, so the rotation is stable.
               */
              const followups = isNonAnswer(body)
                ? DEFAULT_FOLLOWUPS
                : await generateChips({
                    userMessage: trimmedMessage,
                    answer: body,
                    docs: context.map((chunk) => ({
                      title: chunk.source,
                      firstLine: chunk.text.split("\n")[0]?.slice(0, 160) ?? "",
                    })),
                    featureIds: CHIP_FEATURE_DEFAULT,
                    asked: [...askedBefore, trimmedMessage],
                    userAskedAbandoned: askedAboutAbandoned(trimmedMessage),
                    pathIndex: askedBefore.length,
                  });
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
