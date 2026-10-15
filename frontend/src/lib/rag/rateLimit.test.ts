import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rateLimit';

describe('RateLimiter', () => {
  it('allows up to the limit then blocks', () => {
    const r = new RateLimiter({ limit: 2, windowMs: 1000, now: () => 0 });
    expect(r.allow('ip').ok).toBe(true);
    expect(r.allow('ip').ok).toBe(true);
    const third = r.allow('ip');
    expect(third.ok).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it('resets after the window and isolates keys', () => {
    let t = 0;
    const r = new RateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    expect(r.allow('a').ok).toBe(true);
    expect(r.allow('b').ok).toBe(true);
    expect(r.allow('a').ok).toBe(false);
    t = 1001;
    expect(r.allow('a').ok).toBe(true);
  });

  it('drops expired entries so the map cannot grow without bound', () => {
    let t = 0;
    const r = new RateLimiter({ limit: 1, windowMs: 1000, now: () => t, sweepEvery: 10 });
    for (let i = 0; i < 50; i++) r.allow('k' + i);
    t = 5000;
    for (let i = 0; i < 10; i++) r.allow('fresh' + i);
    expect(r.size).toBeLessThanOrEqual(11);
  });

  it('caps the number of tracked keys', () => {
    const r = new RateLimiter({ limit: 1, windowMs: 60000, now: () => 0, maxKeys: 100 });
    for (let i = 0; i < 500; i++) r.allow('k' + i);
    expect(r.size).toBeLessThanOrEqual(100);
  });
});
