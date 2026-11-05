// Failure-only, fixed-window, in-memory limiter.
//
// [ADR] Context: store devices share one LAN address (no proxy header), so a
// limiter that counted every attempt would lock out normal shift-change logins.
// Decision: count failed attempts only; successful sign-ins are never limited.
// Per-user lockout (login.ts) remains the main brute-force control.
// Consequence: in-memory and per process; it resets on restart, which is
// acceptable for a brute-force brake on a single store server.
export interface LimiterState {
  blocked: boolean;
  retryAfterSec: number;
}

const MAX_TRACKED_KEYS = 10_000;

export function createFailureLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();

  const live = (key: string, now: number) => {
    const w = windows.get(key);
    if (!w || now - w.start >= windowMs) return null;
    return w;
  };

  return {
    isBlocked(key: string, now: number = Date.now()): LimiterState {
      const w = live(key, now);
      if (!w || w.count < limit) return { blocked: false, retryAfterSec: 0 };
      return { blocked: true, retryAfterSec: Math.max(1, Math.ceil((w.start + windowMs - now) / 1000)) };
    },
    recordFailure(key: string, now: number = Date.now()): void {
      if (windows.size > MAX_TRACKED_KEYS) {
        for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k);
      }
      const w = live(key, now);
      if (w) w.count += 1;
      else windows.set(key, { start: now, count: 1 });
    },
  };
}

export interface PinLimiterOptions {
  shortLimit: number;
  shortWindowMs: number;
  longLimit: number;
  longWindowMs: number;
}

// [ADR] Context: a PIN can be as short as 4 digits, and one short lock window still allows about 1,400 guesses a day.
// Decision: a few typos earn a short wait; repeated failures earn a much longer one.
// Consequence: guessing becomes slow, and the long lock also stops genuine PINs on that login until it ends.
export function createPinLimiter({ shortLimit, shortWindowMs, longLimit, longWindowMs }: PinLimiterOptions) {
  const short = createFailureLimiter({ limit: shortLimit, windowMs: shortWindowMs });
  const long = createFailureLimiter({ limit: longLimit, windowMs: longWindowMs });
  return {
    isBlocked(key: string, now: number = Date.now()): LimiterState & { long: boolean } {
      const longState = long.isBlocked(key, now);
      if (longState.blocked) return { ...longState, long: true };
      return { ...short.isBlocked(key, now), long: false };
    },
    recordFailure(key: string, now: number = Date.now()): void {
      short.recordFailure(key, now);
      long.recordFailure(key, now);
    },
  };
}
