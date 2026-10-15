import { describe, it, expect, vi } from 'vitest';
import { createOpenAIEmbedder, EmbeddingError, EMBEDDING_DIMENSIONS } from './embeddings';

const vec = (seed: number) => Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => (i === 0 ? seed : 0));

function okResponse(inputs: string[]) {
  // return out of order on purpose; embedder must sort by index
  const data = inputs.map((_, i) => ({ index: i, embedding: vec(i + 1) })).reverse();
  return new Response(JSON.stringify({ data }), { status: 200 });
}

describe('createOpenAIEmbedder', () => {
  it('returns vectors in input order', async () => {
    const fetchImpl = vi.fn(async (_u: any, init: any) => okResponse(JSON.parse(init.body).input));
    const e = createOpenAIEmbedder({ apiKey: 'k', fetchImpl: fetchImpl as any, sleep: async () => {} });
    const out = await e.embed(['a', 'b', 'c']);
    expect(out.map((v) => v[0])).toEqual([1, 2, 3]);
  });

  it('batches large inputs', async () => {
    const fetchImpl = vi.fn(async (_u: any, init: any) => okResponse(JSON.parse(init.body).input));
    const e = createOpenAIEmbedder({ apiKey: 'k', batchSize: 2, fetchImpl: fetchImpl as any, sleep: async () => {} });
    const out = await e.embed(['a', 'b', 'c', 'd', 'e']);
    expect(out).toHaveLength(5);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('returns [] for empty input without calling the API', async () => {
    const fetchImpl = vi.fn();
    const e = createOpenAIEmbedder({ apiKey: 'k', fetchImpl: fetchImpl as any });
    expect(await e.embed([])).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws EmbeddingError on a non-retryable API error', async () => {
    const fetchImpl = vi.fn(async () => new Response('bad key', { status: 401, statusText: 'Unauthorized' }));
    const e = createOpenAIEmbedder({ apiKey: 'k', fetchImpl: fetchImpl as any, sleep: async () => {} });
    await expect(e.embed(['a'])).rejects.toBeInstanceOf(EmbeddingError);
  });

  it('throws EmbeddingError when the vector count does not match', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));
    const e = createOpenAIEmbedder({ apiKey: 'k', fetchImpl: fetchImpl as any, sleep: async () => {} });
    await expect(e.embed(['a'])).rejects.toBeInstanceOf(EmbeddingError);
  });

  it('throws EmbeddingError when the API key is missing', async () => {
    const e = createOpenAIEmbedder({ apiKey: '' });
    await expect(e.embed(['a'])).rejects.toBeInstanceOf(EmbeddingError);
  });
});
