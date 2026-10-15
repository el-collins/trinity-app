import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { RateLimiter } from '@/lib/rag/rateLimit';
import { RagUpstreamError } from '@/lib/rag/service';

const ask = vi.fn();
let limiter = new RateLimiter({ limit: 10 });
let ready: Promise<void> = Promise.resolve();

vi.mock('@/lib/rag', () => ({
  ragEnabled: () => process.env.RAG_ENABLED === 'true',
  getRag: () => ({ service: { ask }, limiter, ready }),
}));

import { POST } from './route';

const post = (body: unknown, ip = '1.1.1.1') =>
  new NextRequest('http://localhost/api/rag/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeEach(() => {
  process.env.RAG_ENABLED = 'true';
  ask.mockReset();
  limiter = new RateLimiter({ limit: 10 });
  ready = Promise.resolve();
});

describe('POST /api/rag/ask', () => {
  it('returns 503 when RAG is disabled', async () => {
    process.env.RAG_ENABLED = 'false';
    const res = await POST(post({ loanTypeId: 'sba', question: 'q' }));
    expect(res.status).toBe(503);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await POST(post('{not json'));
    expect(res.status).toBe(400);
    expect(ask).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid input without calling the service', async () => {
    const res = await POST(post({ loanTypeId: 'sba', question: '   ' }));
    expect(res.status).toBe(400);
    expect(ask).not.toHaveBeenCalled();
  });

  it('returns 429 with Retry-After after the limit', async () => {
    limiter = new RateLimiter({ limit: 1 });
    ask.mockResolvedValue({ answer: 'a', citations: [], abstained: false, ungroundedIds: [], cached: false });
    await POST(post({ loanTypeId: 'sba', question: 'q' }, '9.9.9.9'));
    const res = await POST(post({ loanTypeId: 'sba', question: 'q' }, '9.9.9.9'));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('returns 503 (not 500) when Neo4j was not ready, without calling the service', async () => {
    ready = Promise.reject(new Error('ServiceUnavailable'));
    ready.catch(() => {});
    const res = await POST(post({ loanTypeId: 'sba', question: 'q' }));
    expect(res.status).toBe(503);
    expect(ask).not.toHaveBeenCalled();
  });

  it('returns 400 for an unknown loan type', async () => {
    const { RagInputError } = await import('@/lib/rag/service');
    ask.mockRejectedValue(new RagInputError('Unknown loan type'));
    const res = await POST(post({ loanTypeId: 'zzz', question: 'q' }));
    expect(res.status).toBe(400);
  });

  it('returns 502 when the upstream fails', async () => {
    ask.mockRejectedValue(new RagUpstreamError('down'));
    const res = await POST(post({ loanTypeId: 'sba', question: 'q' }));
    expect(res.status).toBe(502);
  });

  it('returns the answer on success', async () => {
    ask.mockResolvedValue({ answer: 'ok [doc 1]', citations: [{ id: 1, docTitle: 'T', page: 1 }], abstained: false, ungroundedIds: [], cached: false });
    const res = await POST(post({ loanTypeId: 'sba', question: 'q' }));
    expect(res.status).toBe(200);
    expect((await res.json()).answer).toBe('ok [doc 1]');
  });
});
