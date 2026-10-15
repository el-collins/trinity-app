import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const listDocs = vi.fn(async () => [{ id: 'd1', title: 'T' }]);
const deleteDoc = vi.fn(async () => {});
const bumpCorpusVersion = vi.fn(async () => 2);

vi.mock('@/lib/rag', () => ({
  ragEnabled: () => process.env.RAG_ENABLED === 'true',
  getRag: () => ({
    ready: Promise.resolve(),
    store: { listDocs, deleteDoc, bumpCorpusVersion },
    embedder: { embed: vi.fn() },
  }),
}));

import { GET, POST } from './route';
import { DELETE } from './[id]/route';

const KEY = 'test-admin-key-123456';
const req = (method: string, headers: Record<string, string> = {}, body?: BodyInit) =>
  new NextRequest('http://localhost/api/admin/rag/documents', { method, headers, body });

beforeEach(() => {
  process.env.RAG_ENABLED = 'true';
  process.env.RAG_ADMIN_KEY = KEY;
  process.env.ADMIN_SESSION_SECRET = 'unit-test-secret-unit-test-secret';
  listDocs.mockClear();
  deleteDoc.mockClear();
});

describe('admin RAG documents API', () => {
  it('rejects GET without credentials', async () => {
    const res = await GET(req('GET'));
    expect(res.status).toBe(401);
    expect(listDocs).not.toHaveBeenCalled();
  });

  it('rejects GET with a wrong admin key', async () => {
    const res = await GET(req('GET', { 'x-rag-admin-key': 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('lists documents with the admin key', async () => {
    const res = await GET(req('GET', { 'x-rag-admin-key': KEY }));
    expect(res.status).toBe(200);
    expect((await res.json()).documents).toHaveLength(1);
  });

  it('rejects POST without credentials', async () => {
    const res = await POST(req('POST'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when the upload has no file', async () => {
    const form = new FormData();
    form.set('title', 'x');
    const res = await POST(req('POST', { 'x-rag-admin-key': KEY }, form));
    expect(res.status).toBe(400);
  });

  it('rejects DELETE without credentials and does not delete', async () => {
    const res = await DELETE(req('DELETE'), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(401);
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it('deletes with the admin key and bumps the corpus version', async () => {
    const res = await DELETE(req('DELETE', { 'x-rag-admin-key': KEY }), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(200);
    expect(deleteDoc).toHaveBeenCalledWith('d1');
    expect(bumpCorpusVersion).toHaveBeenCalled();
  });
});
