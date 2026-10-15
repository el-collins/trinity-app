import { describe, it, expect, vi, beforeEach } from 'vitest';

const ensureSchema = vi.fn();
const close = vi.fn(async () => {});

vi.mock('neo4j-driver', () => ({
  default: { driver: () => ({ close }), auth: { basic: () => ({}) } },
}));
vi.mock('@/lib/ai/client', () => ({ aiClient: { chat: vi.fn() } }));
vi.mock('./store', () => ({
  createStore: () => ({ ensureSchema }),
}));

describe('getRag', () => {
  beforeEach(() => {
    delete (globalThis as { __ragRuntime?: unknown }).__ragRuntime;
    vi.resetModules();
    ensureSchema.mockReset();
    close.mockClear();
  });

  it('retries schema setup on the next call after Neo4j was unavailable', async () => {
    ensureSchema.mockRejectedValueOnce(new Error('ServiceUnavailable')).mockResolvedValueOnce(undefined);
    const { getRag } = await import('./index');

    const first = getRag();
    await expect(first.ready).rejects.toThrow('ServiceUnavailable');

    const second = getRag();
    expect(second).not.toBe(first);
    await expect(second.ready).resolves.toBeUndefined();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
