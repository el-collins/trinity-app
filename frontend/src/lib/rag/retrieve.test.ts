import { describe, it, expect, vi } from 'vitest';
import { retrieve } from './retrieve';
import type { RetrievedChunk } from './types';

const chunk = (id: string, score: number, source: 'loan_doc' | 'field_help' = 'loan_doc'): RetrievedChunk => ({
  id, text: id, page: 1, score, docId: 'd', docTitle: 'D', source,
});

function deps(loan: RetrievedChunk[], help: RetrievedChunk[] = []) {
  return {
    embedder: { embed: vi.fn(async () => [[0.1, 0.2]]) },
    store: {
      searchLoanDocs: vi.fn(async () => loan),
      searchFieldHelp: vi.fn(async () => help),
    } as any,
  };
}

describe('retrieve', () => {
  it('embeds the question once and scopes the loan search to the loan type', async () => {
    const d = deps([chunk('a', 0.9)]);
    const out = await retrieve(d, { question: 'what is x?', loanTypeId: 'sba' });
    expect(d.embedder.embed).toHaveBeenCalledWith(['what is x?']);
    expect(d.store.searchLoanDocs).toHaveBeenCalledWith([0.1, 0.2], 'sba', 5);
    expect(out.map((c) => c.id)).toEqual(['a']);
  });

  it('does not query field help without a fieldId', async () => {
    const d = deps([chunk('a', 0.9)]);
    await retrieve(d, { question: 'q', loanTypeId: 'sba' });
    expect(d.store.searchFieldHelp).not.toHaveBeenCalled();
  });

  it('puts field help first (max 2) and fills the rest with loan chunks up to k', async () => {
    const d = deps(
      [chunk('l1', 0.9), chunk('l2', 0.8), chunk('l3', 0.7), chunk('l4', 0.6), chunk('l5', 0.5)],
      [chunk('h1', 0.8, 'field_help'), chunk('h2', 0.7, 'field_help'), chunk('h3', 0.6, 'field_help')]
    );
    const out = await retrieve(d, { question: 'q', loanTypeId: 'sba', fieldId: 'ein' });
    expect(out.map((c) => c.id)).toEqual(['h1', 'h2', 'l1', 'l2', 'l3']);
  });

  it('deduplicates by id', async () => {
    const d = deps([chunk('a', 0.9), chunk('a', 0.9)]);
    const out = await retrieve(d, { question: 'q', loanTypeId: 'sba' });
    expect(out).toHaveLength(1);
  });

  it('returns an empty list when nothing matches', async () => {
    const d = deps([]);
    expect(await retrieve(d, { question: 'q', loanTypeId: 'sba' })).toEqual([]);
  });
});
