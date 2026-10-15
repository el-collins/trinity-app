import { describe, it, expect, vi } from 'vitest';
import { fetchWithRetry } from './http';

const ok = () => new Response('{}', { status: 200 });
const status = (code: number, headers: Record<string, string> = {}) =>
  new Response('err', { status: code, headers });

describe('fetchWithRetry', () => {
  it('returns first success without retrying', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    const { response, attempts } = await fetchWithRetry('http://x', {}, { fetchImpl, sleep: async () => {} });
    expect(response.status).toBe(200);
    expect(attempts).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries 503 then succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(status(503)).mockResolvedValueOnce(ok());
    const sleep = vi.fn().mockResolvedValue(undefined);
    const { response, attempts } = await fetchWithRetry('http://x', {}, { fetchImpl, sleep });
    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('retries 429 and honors Retry-After (capped at 5s)', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(status(429, { 'retry-after': '60' }))
      .mockResolvedValueOnce(ok());
    const sleep = vi.fn().mockResolvedValue(undefined);
    await fetchWithRetry('http://x', {}, { fetchImpl, sleep });
    expect(sleep).toHaveBeenCalledWith(5000);
  });

  it('does not retry a 400', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(status(400));
    const { response, attempts } = await fetchWithRetry('http://x', {}, { fetchImpl, sleep: async () => {} });
    expect(response.status).toBe(400);
    expect(attempts).toBe(1);
  });

  it('gives up after 2 retries and returns the last response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(status(500));
    const { response, attempts } = await fetchWithRetry('http://x', {}, { fetchImpl, sleep: async () => {} });
    expect(response.status).toBe(500);
    expect(attempts).toBe(3);
  });

  it('retries a network error then succeeds', async () => {
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(ok());
    const { attempts } = await fetchWithRetry('http://x', {}, { fetchImpl, sleep: async () => {} });
    expect(attempts).toBe(2);
  });

  it('throws a timeout error after retries when every attempt aborts', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const fetchImpl = vi.fn().mockRejectedValue(abort);
    await expect(
      fetchWithRetry('http://x', {}, { fetchImpl, sleep: async () => {}, timeoutMs: 10 })
    ).rejects.toThrow(/timed out/i);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
