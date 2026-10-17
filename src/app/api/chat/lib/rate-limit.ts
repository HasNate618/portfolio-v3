const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

interface Window {
  windowMs: number;
  max: number;
}

interface Counter {
  count: number;
  resetTime: number;
}

function limitFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const CHAT_PER_HOUR = limitFromEnv("CHAT_REQUESTS_PER_HOUR", 20);
export const CHAT_PER_DAY = limitFromEnv("CHAT_REQUESTS_PER_DAY", 300);
export const SEARCH_PER_HOUR = limitFromEnv("SEARCH_REQUESTS_PER_HOUR", 60);
export const SEARCH_PER_DAY = limitFromEnv("SEARCH_REQUESTS_PER_DAY", 1000);

/**
 * Fixed-window counters, held in this process.
 *
 * On serverless that means each instance keeps its own and a cold start resets
 * them, so these are a brake on a runaway visitor or crawler rather than a
 * global guarantee. A cap that cannot be reset by redeploying needs a shared
 * store, which is a dependency this site does not have.
 */
function fixedWindow({ windowMs, max }: Window) {
  const hits = new Map<string, Counter>();

  return function check(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();

    for (const [existing, entry] of hits) {
      if (now > entry.resetTime) hits.delete(existing);
    }

    const entry = hits.get(key);
    if (!entry || now > entry.resetTime) {
      hits.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    entry.count += 1;

    if (entry.count > max) {
      return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
    }

    return { allowed: true };
  };
}

/** The chat's per-address budget. */
export const checkRateLimit = fixedWindow({ windowMs: HOUR_MS, max: CHAT_PER_HOUR });

/** Search is an embed and a rerank with no generation, so it gets more room. */
export const checkSearchRateLimit = fixedWindow({ windowMs: HOUR_MS, max: SEARCH_PER_HOUR });

/** Site-wide daily ceilings, keyed by a constant rather than by address. */
export const checkChatDailyCap = fixedWindow({ windowMs: DAY_MS, max: CHAT_PER_DAY });
export const checkSearchDailyCap = fixedWindow({ windowMs: DAY_MS, max: SEARCH_PER_DAY });

/** The one key the daily caps use. */
export const SITE_KEY = "site";
