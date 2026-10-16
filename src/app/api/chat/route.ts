import { retrieveRelevantChunks, rerankChunks } from "./lib/rag";
import { buildRetrievalQuery } from "./lib/retrieval-query";
import { buildSystemPrompt } from "./lib/system-prompt";
import { generateFollowups, formatFollowupsBlock } from "./lib/generate-followups";
import { checkRateLimit } from "./lib/rate-limit";
import { getCohereClient, MAX_CHAT_MESSAGE_LENGTH, CHAT_MODEL, CHAT_MAX_TOKENS, CHAT_THINKING_ENABLED } from "./lib/cohere";
import { FOLLOWUP_DELIMITER, stripBodyPrefix } from "@/lib/tts/stream-delimiters";

interface ChatHistoryMessage {
  role: string;
  content: string;
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
      temperature: 0.7,
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
          try {
            for await (const chunk of stream) {
              if (closed || req.signal.aborted) break;
              if (chunk.type === "content-delta") {
                const content = chunk.delta?.message?.content;
                if (content?.thinking) continue;
                const text = content?.text ?? "";
                totalChars += text.length;
                if (totalChars > MAX_CHARS) break;
                accumulated += text;
                enqueueText(text);
              }
            }

            if (!closed && !req.signal.aborted && !accumulated.includes(FOLLOWUP_DELIMITER)) {
              const followups = await generateFollowups({
                userMessage: trimmedMessage,
                aiResponse: stripBodyPrefix(accumulated),
                chunkSources: reranked.map((c) => c.source),
                history: safeHistory,
              });
              enqueueText(formatFollowupsBlock(followups));
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
