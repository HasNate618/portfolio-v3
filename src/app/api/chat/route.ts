import { retrieveRelevantChunks, rerankChunks } from "./lib/rag";
import { buildRetrievalQuery } from "./lib/retrieval-query";
import { buildSystemPrompt } from "./lib/system-prompt";
import { generateFollowups, formatFollowupsTail } from "./lib/generate-followups";
import { buildFallbackFollowups, DEFAULT_FOLLOWUPS, isNonAnswer } from "./lib/followup-fallback";
import { checkRateLimit } from "./lib/rate-limit";
import { DashFilter, sanitizeDashes } from "./lib/sanitize-dashes";
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

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      });
    }

    const { message, history = [] } = (await req.json()) as {
      message?: string;
      history?: ChatHistoryMessage[];
    };

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (trimmedMessage.length > MAX_CHAT_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Message must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const safeHistory = history.filter((m) => m.content && m.content.trim().length > 0);
    const retrievalQuery = buildRetrievalQuery(trimmedMessage, safeHistory);

    const topChunks = await retrieveRelevantChunks(retrievalQuery, 30);
    const reranked = await rerankChunks(retrievalQuery, topChunks, 10);
    const systemPrompt = buildSystemPrompt(reranked);

    const cohere = getCohereClient();

    const stream = await cohere.v2.chatStream({
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

          let totalChars = 0;
          const MAX_CHARS = 32000;
          let accumulated = "";
          const dashes = new DashFilter();

          const followupInput = () => ({
            userMessage: trimmedMessage,
            aiResponse: stripBodyPrefix(accumulated),
            chunkSources: reranked.map((c) => c.source),
            history: safeHistory,
          });

          /*
           * Started mid-answer, not after it. This is a second, unstreamed model
           * call, and waiting for the answer to finish before starting it is what
           * made the questions feel slow: the visitor paid for the whole answer,
           * then paid again for the questions.
           */
          let followupsPending: Promise<string[]> | null = null;

          try {
            for await (const chunk of stream) {
              if (closed || req.signal.aborted) break;
              if (chunk.type === "content-delta") {
                const content = chunk.delta?.message?.content;
                if (content?.thinking) continue;
                const text = content?.text ?? "";
                totalChars += text.length;
                if (totalChars > MAX_CHARS) break;
                const safe = dashes.push(text);
                accumulated += safe;
                enqueueText(safe);
                if (!followupsPending && accumulated.length >= FOLLOWUP_START_CHARS) {
                  followupsPending = generateFollowups(followupInput());
                }
              }
            }

            // The filter holds a short tail back, so the answer is not finished
            // until that is released. It goes out before the delimiter that says
            // the answer is done.
            const tail = dashes.flush();
            if (tail) {
              accumulated += tail;
              enqueueText(tail);
            }

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
                    followupsPending ?? generateFollowups(followupInput()),
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
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
