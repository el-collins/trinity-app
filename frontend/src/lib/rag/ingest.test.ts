import { describe, it, expect, vi } from 'vitest';
import { ingestDocument } from './ingest';
import { IngestError } from './parser';
import { EmbeddingError } from './embeddings';
import type { RagStore } from './store';

function fakeStore(): RagStore & { calls: string[]; chunks: any[] } {
  const calls: string[] = [];
  const state = { chunks: [] as any[] };
  return {
    calls,
    get chunks() { return state.chunks; },
    ensureSchema: vi.fn(),
    loanTypesExist: vi.fn(async () => true),
    createDoc: vi.fn(async () => { calls.push('createDoc'); }),
    addChunks: vi.fn(async (_id: string, c: any[]) => { calls.push('addChunks'); state.chunks.push(...c); }),
    deleteChunks: vi.fn(async () => { calls.push('deleteChunks'); state.chunks = []; }),
    setDocStatus: vi.fn(async (_id: string, s: string) => { calls.push(`status:${s}`); }),
    deleteDoc: vi.fn(),
    listDocs: vi.fn(),
    searchLoanDocs: vi.fn(),
    searchFieldHelp: vi.fn(),
    replaceFieldHelp: vi.fn(),
    listFieldsWithHelp: vi.fn(),
    getCorpusVersion: vi.fn(),
    bumpCorpusVersion: vi.fn(async () => { calls.push('bump'); return 2; }),
  } as any;
}

const okEmbedder = { embed: vi.fn(async (t: string[]) => t.map(() => new Array(1536).fill(0.1))) };
const input = (text: string, filename = 'terms.md') => ({
  id: 'doc1', title: 'Terms', filename, loanTypeIds: ['sba'], buffer: Buffer.from(text),
});

describe('ingestDocument', () => {
  it('stores chunks, marks the document ready and bumps the corpus version', async () => {
    const store = fakeStore();
    const out = await ingestDocument({ store, embedder: okEmbedder }, input('word '.repeat(100)));
    expect(out.chunks).toBeGreaterThan(0);
    expect(store.calls).toEqual(['createDoc', 'addChunks', 'status:ready', 'bump']);
    expect(store.chunks[0].id).toBe('doc1:0');
  });

  it('fails with NO_TEXT for a document with no extractable text and leaves status failed', async () => {
    const store = fakeStore();
    await expect(ingestDocument({ store, embedder: okEmbedder }, input('   \n  '))).rejects.toMatchObject({ code: 'NO_TEXT' });
    expect(store.calls).toContain('status:failed');
    expect(store.chunks).toHaveLength(0);
  });

  it('removes partial chunks and marks failed when embedding fails', async () => {
    const store = fakeStore();
    const badEmbedder = { embed: vi.fn(async () => { throw new EmbeddingError('down'); }) };
    await expect(ingestDocument({ store, embedder: badEmbedder }, input('word '.repeat(100)))).rejects.toMatchObject({
      code: 'EMBEDDING_FAILED',
    });
    expect(store.calls).toContain('deleteChunks');
    expect(store.calls).toContain('status:failed');
    expect(store.chunks).toHaveLength(0);
  });

  it('rejects unknown loan types before creating anything', async () => {
    const store = fakeStore();
    (store.loanTypesExist as any).mockResolvedValue(false);
    await expect(ingestDocument({ store, embedder: okEmbedder }, input('text here'))).rejects.toMatchObject({
      code: 'UNKNOWN_LOAN_TYPE',
    });
    expect(store.calls).toEqual([]);
  });

  it('rejects unsupported types before creating anything', async () => {
    const store = fakeStore();
    await expect(ingestDocument({ store, embedder: okEmbedder }, input('x', 'a.exe'))).rejects.toBeInstanceOf(IngestError);
    expect(store.calls).toEqual([]);
  });
});
