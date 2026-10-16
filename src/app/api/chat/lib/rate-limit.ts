const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 20;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const hits = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetTime) {
      hits.delete(ip);
    }
  }
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  cleanup();

  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetTime) {
    hits.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}
