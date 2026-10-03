// Fixed-window, in-memory rate limiter. One store = one Node process, so
// in-memory is enough; it resets on restart (acceptable for a brute-force brake).
export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

const MAX_TRACKED_KEYS = 10_000;

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      if (windows.size > MAX_TRACKED_KEYS) {
        for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
      }
      const current = windows.get(key);
      if (!current || now - current.start >= windowMs) {
        windows.set(key, { start: now, count: 1 });
        return { allowed: true, retryAfterSec: 0 };
      }
      if (current.count >= limit) {
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((current.start + windowMs - now) / 1000)) };
      }
      current.count += 1;
      return { allowed: true, retryAfterSec: 0 };
    },
  };
}
