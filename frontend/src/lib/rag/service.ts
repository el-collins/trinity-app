import { ABSTAIN_TEXT, answerQuestion, type Llm } from './answer';
import { makeAnswerKey, TTLCache } from './cache';
import { EmbeddingError, type Embedder } from './embeddings';
import { retrieve } from './retrieve';
import type { RagStore } from './store';
import type { AskResult } from './types';

export class RagUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RagUpstreamError';
  }
}

export class RagInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RagInputError';
  }
}

export interface RagService {
  ask(input: { loanTypeId: string; question: string; fieldId?: string }): Promise<AskResult & { cached: boolean }>;
}

export function createRagService(deps: {
  embedder: Embedder;
  store: RagStore;
  llm: Llm;
  minScore: number;
  cache?: TTLCache<AskResult>;
}): RagService {
  const cache = deps.cache ?? new TTLCache<AskResult>();

  return {
    async ask(input) {
      try {
        const corpusVersion = await deps.store.getCorpusVersion();
        const key = makeAnswerKey({ ...input, corpusVersion });
        const hit = cache.get(key);
        if (hit) return { ...hit, cached: true };

        const chunks = await retrieve({ embedder: deps.embedder, store: deps.store }, input);
        const best = chunks.reduce((m, c) => Math.max(m, c.score), 0);

        let result: AskResult;
        if (chunks.length === 0 || best < deps.minScore) {
          result = { answer: ABSTAIN_TEXT, citations: [], abstained: true, ungroundedIds: [] };
        } else {
          result = await answerQuestion({ question: input.question, chunks, llm: deps.llm });
        }
        cache.set(key, result);
        return { ...result, cached: false };
      } catch (error) {
        if (error instanceof RagInputError || error instanceof RagUpstreamError) throw error;
        if (error instanceof EmbeddingError) throw new RagUpstreamError(error.message);
        throw new RagUpstreamError(error instanceof Error ? error.message : 'RAG request failed');
      }
    },
  };
}
