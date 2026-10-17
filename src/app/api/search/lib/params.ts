/**
 * Query parsing and response shaping for /api/search.
 *
 * These live outside route.ts on purpose: the Next.js build type-checks the
 * exports of a route module and fails on anything that is not a route field
 * ("parseSearchParams is not a valid Route export field"). Tests and Route files
 * can still import them from here.
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
  const limit =
    Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : DEFAULT_LIMIT;

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
