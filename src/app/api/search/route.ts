import { rerankChunks, retrieveRelevantChunks } from "../chat/lib/rag";
import { checkSearchDailyCap, checkSearchRateLimit, SITE_KEY } from "../chat/lib/rate-limit";
import { parseSearchParams, shapeHits } from "./lib/params";
import { siteBaseUrl } from "@/lib/site-url";

/**
 * Retrieval without generation: the machine-facing half of the chat.
 *
 * An agent that wants a fact gets the record's own sentence and a URL to quote,
 * for one embed and one rerank instead of a full generation. That is roughly a
 * hundredth of the cost, it cannot drift the way a paraphrase can, and the same
 * query twice is free because the response is cacheable.
 *
 * The full text stays at /knowledgebase/*.md. This ranks it, it does not hide it.
 *
 * The route file exports the handler and nothing else: the build type-checks the
 * exports of a route module, and a helper exported here fails it.
 */

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export async function GET(req: Request): Promise<Response> {
  try {
    // new URL() throws on a malformed request URL, so this stays inside the try.
    const parsed = parseSearchParams(new URL(req.url).searchParams);
    if ("error" in parsed) {
      return json({ error: parsed.error }, 400);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const hourly = checkSearchRateLimit(ip);
    if (!hourly.allowed) {
      return json({ error: "Rate limit exceeded" }, 429, { "Retry-After": String(hourly.retryAfter) });
    }

    const daily = checkSearchDailyCap(SITE_KEY);
    if (!daily.allowed) {
      return json({ error: "Daily search limit reached" }, 429, { "Retry-After": String(daily.retryAfter) });
    }

    const candidates = await retrieveRelevantChunks(parsed.query, Math.max(20, parsed.limit * 4));
    const ranked = await rerankChunks(parsed.query, candidates, parsed.limit);

    return json(
      { query: parsed.query, count: ranked.length, results: shapeHits(ranked, siteBaseUrl()) },
      200,
      { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    );
  } catch (error) {
    console.error("Search API error:", error);
    return json({ error: "Search failed" }, 500);
  }
}
