// Simple in-memory fixed-window rate limiter.
// Note: state is per-instance, so under Cloud Run horizontal scaling the
// effective limit is (limit * instanceCount). It meaningfully slows brute-force
// and abuse but is not a substitute for a shared store (e.g. Redis) if strict
// global limits are required.

type Window = { count: number; resetAt: number };
const buckets = new Map<string, Window>();

/**
 * Returns true if the action is allowed, false if the limit is exceeded.
 * @param key      Identifier to throttle on (e.g. `login:<username>`).
 * @param limit    Max allowed actions per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
}
