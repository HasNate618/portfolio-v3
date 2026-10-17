import { rerankChunks, retrieveRelevantChunks } from "../chat/lib/rag";
import { checkSearchDailyCap, checkSearchRateLimit, SITE_KEY } from "../chat/lib/rate-limit";
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
 */

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const MIN_QUERY_CHARS = 2;
const MAX_QUERY_CHARS = 200;

export interface SearchParams {
  query: string;
  limit: number;
}

export function parseSearchParams(params: URLSearchParams): SearchParams | { error: string } {
  const query = (params.get("q") ?? "").trim();

  if (query.length < MIN_QUERY_CHARS) {
    return { error: `Add a q parameter of at least ${MIN_QUERY_CHARS} characters.` };
  }

  if (query.length > MAX_QUERY_CHARS) {
    return { error: `q must be ${MAX_QUERY_CHARS} characters or fewer.` };
  }

  const requested = Number.parseInt(params.get("limit") ?? "", 10);
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT;

  return { query, limit };
}

export interface SearchHit {
  score: number;
  source: string;
  section: string;
  url: string;
  text: string;
}

interface RankedChunk {
  score: number;
  source: string;
  section: string;
  text: string;
}

export function shapeHits(chunks: RankedChunk[], base: string): SearchHit[] {
  return chunks.map((chunk) => ({
    score: Number(chunk.score.toFixed(4)),
    source: chunk.source,
    section: chunk.section,
    url: `${base}/knowledgebase/${chunk.source}`,
    text: chunk.text,
  }));
}

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
