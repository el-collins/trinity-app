import { describe, it, expect, vi } from 'vitest';
import { createRagService, RagInputError, RagUpstreamError } from './service';
import { TTLCache } from './cache';
import { ABSTAIN_TEXT } from './answer';
import { EmbeddingError } from './embeddings';
import type { AskResult, RetrievedChunk } from './types';

const hit = (score: number): RetrievedChunk => ({
  id: 'c1', text: 'Rates start at 7 percent.', page: 1, score, docId: 'd', docTitle: 'Terms', source: 'loan_doc',
});

function build(opts: { chunks?: RetrievedChunk[]; version?: number; llmContent?: string; embedFails?: boolean; knownLoanType?: boolean } = {}) {
  const store = {
    searchLoanDocs: vi.fn(async () => opts.chunks ?? [hit(0.9)]),
    searchFieldHelp: vi.fn(async () => []),
    getCorpusVersion: vi.fn(async () => opts.version ?? 1),
    loanTypesExist: vi.fn(async () => opts.knownLoanType ?? true),
  } as any;
  const embedder = {
    embed: vi.fn(async () => {
      if (opts.embedFails) throw new EmbeddingError('down');
      return [[0.1]];
    }),
  };
  const llm = { chat: vi.fn(async () => ({ content: opts.llmContent ?? 'Rates start at 7 percent [doc 1].' })) };
  const cache = new TTLCache<AskResult>();
  const svc = createRagService({ embedder, store, llm, minScore: 0.65, cache });
  return { svc, store, llm, embedder };
}

const q = { loanTypeId: 'sba', question: 'What is the rate?' };

describe('RagService.ask', () => {
  it('answers with citations', async () => {
    const { svc } = build();
    const r = await svc.ask(q);
    expect(r.abstained).toBe(false);
    expect(r.cached).toBe(false);
  });

  it('abstains without calling the model when the best score is below the threshold', async () => {
    const { svc, llm } = build({ chunks: [hit(0.4)] });
    const r = await svc.ask(q);
    expect(r.abstained).toBe(true);
    expect(r.answer).toBe(ABSTAIN_TEXT);
    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('serves the second identical question from cache without calling the model again', async () => {
    const { svc, llm } = build();
    await svc.ask(q);
    const second = await svc.ask({ ...q, question: 'what is the RATE?' });
    expect(second.cached).toBe(true);
    expect(llm.chat).toHaveBeenCalledTimes(1);
  });

  it('does not reuse a cached answer after the corpus version changes', async () => {
    const { svc, store, llm } = build();
    await svc.ask(q);
    store.getCorpusVersion.mockResolvedValue(2);
    const r = await svc.ask(q);
    expect(r.cached).toBe(false);
    expect(llm.chat).toHaveBeenCalledTimes(2);
  });

  it('maps embedding failures to RagUpstreamError', async () => {
    const { svc } = build({ embedFails: true });
    await expect(svc.ask(q)).rejects.toBeInstanceOf(RagUpstreamError);
  });

  it('maps model failures to RagUpstreamError', async () => {
    const { svc, llm } = build();
    llm.chat.mockRejectedValue(new Error('Anthropic API error'));
    await expect(svc.ask(q)).rejects.toBeInstanceOf(RagUpstreamError);
  });

  it('rejects an unknown loan type with RagInputError before embedding or calling the model', async () => {
    const { svc, embedder, llm } = build({ knownLoanType: false });
    await expect(svc.ask({ loanTypeId: 'zzz', question: 'rate?' })).rejects.toBeInstanceOf(RagInputError);
    expect(embedder.embed).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
  });

  it('does not cache an abstention caused by zero retrieved chunks', async () => {
    const { svc, store, llm } = build({ chunks: [] });
    const first = await svc.ask(q);
    expect(first.abstained).toBe(true);
    store.searchLoanDocs.mockResolvedValue([hit(0.9)]);
    const second = await svc.ask(q);
    expect(second.cached).toBe(false);
    expect(second.abstained).toBe(false);
    expect(llm.chat).toHaveBeenCalledTimes(1);
  });
});
