import { fetchWithRetry } from '@/lib/ai/http';

export const EMBEDDING_DIMENSIONS = 1536;

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export class EmbeddingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

export function createOpenAIEmbedder(opts: {
  apiKey: string;
  model?: string;
  batchSize?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}): Embedder {
  const model = opts.model ?? 'text-embedding-3-small';
  const batchSize = opts.batchSize ?? 64;

  async function embedBatch(batch: string[]): Promise<number[][]> {
    if (!opts.apiKey) throw new EmbeddingError('OPENAI_API_KEY is not configured');
    let response: Response;
    try {
      ({ response } = await fetchWithRetry(
        'https://api.openai.com/v1/embeddings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${opts.apiKey}`,
          },
          body: JSON.stringify({ model, input: batch }),
        },
        { fetchImpl: opts.fetchImpl, sleep: opts.sleep }
      ));
    } catch (e) {
      throw new EmbeddingError(`Embedding request failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
    if (!response.ok) {
      throw new EmbeddingError(`Embedding API error: ${response.status} ${response.statusText}`);
    }
    const json = (await response.json()) as { data?: { index: number; embedding: number[] }[] };
    const data = json.data ?? [];
    if (data.length !== batch.length) {
      throw new EmbeddingError(`Embedding API returned ${data.length} vectors for ${batch.length} inputs`);
    }
    return [...data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }

  return {
    async embed(texts: string[]): Promise<number[][]> {
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += batchSize) {
        out.push(...(await embedBatch(texts.slice(i, i + batchSize))));
      }
      return out;
    },
  };
}
