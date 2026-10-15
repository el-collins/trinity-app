export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  private limit: number;
  private windowMs: number;
  private now: () => number;
  private maxKeys: number;
  private sweepEvery: number;
  private calls = 0;

  constructor(
    opts: { limit?: number; windowMs?: number; now?: () => number; maxKeys?: number; sweepEvery?: number } = {}
  ) {
    this.limit = opts.limit ?? 10;
    this.windowMs = opts.windowMs ?? 60_000;
    this.now = opts.now ?? Date.now;
    this.maxKeys = opts.maxKeys ?? 10_000;
    this.sweepEvery = opts.sweepEvery ?? 100;
  }

  get size(): number {
    return this.hits.size;
  }

  allow(key: string): { ok: boolean; retryAfterSec: number } {
    const now = this.now();
    this.calls += 1;
    if (this.calls % this.sweepEvery === 0 || this.hits.size >= this.maxKeys) this.sweep(now);

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

  private sweep(now: number): void {
    for (const [k, v] of this.hits) {
      if (v.resetAt <= now) this.hits.delete(k);
    }
    // Still full of live keys (e.g. an attacker rotating identifiers): evict the oldest inserted.
    while (this.hits.size >= this.maxKeys) {
      const oldest = this.hits.keys().next().value as string;
      this.hits.delete(oldest);
    }
  }
}
