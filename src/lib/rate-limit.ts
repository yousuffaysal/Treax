import 'server-only';

/**
 * Fixed-window rate limiter, in-process.
 *
 * This is deliberately simple: it protects a single instance against the abuse
 * that matters here (posting floods, AI-endpoint spend, credential stuffing).
 * On multi-instance deploys it degrades to per-instance limits — swap the Map
 * for Upstash Redis and the call sites stay unchanged.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type Limit = { limit: number; windowMs: number };

export const LIMITS = {
  post: { limit: 8, windowMs: 60 * 60 * 1000 },
  comment: { limit: 30, windowMs: 60 * 60 * 1000 },
  ai: { limit: 20, windowMs: 60 * 60 * 1000 },
  filter: { limit: 40, windowMs: 60 * 60 * 1000 },
  agent: { limit: 30, windowMs: 60 * 60 * 1000 },
  auth: { limit: 10, windowMs: 15 * 60 * 1000 },
  message: { limit: 120, windowMs: 60 * 60 * 1000 },
  upload: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, Limit>;

export type LimitKey = keyof typeof LIMITS;

export type RateResult = { allowed: boolean; remaining: number; retryAfterMs: number };

export function rateLimit(key: LimitKey, identifier: string): RateResult {
  const { limit, windowMs } = LIMITS[key];
  const id = `${key}:${identifier}`;
  const now = Date.now();

  const existing = buckets.get(id);
  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    sweep(now);
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 };
}

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimitMessage(result: RateResult): string {
  const minutes = Math.max(1, Math.ceil(result.retryAfterMs / 60000));
  return `You are doing that too often. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}
