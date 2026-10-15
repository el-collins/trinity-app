export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  private limit: number;
  private windowMs: number;
  private now: () => number;

  constructor(opts: { limit?: number; windowMs?: number; now?: () => number } = {}) {
    this.limit = opts.limit ?? 10;
    this.windowMs = opts.windowMs ?? 60_000;
    this.now = opts.now ?? Date.now;
  }

  allow(key: string): { ok: boolean; retryAfterSec: number } {
    const now = this.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return { ok: true, retryAfterSec: 0 };
    }
    if (entry.count < this.limit) {
      entry.count += 1;
      return { ok: true, retryAfterSec: 0 };
    }
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
}
