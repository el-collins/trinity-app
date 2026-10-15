import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isAdminRequest } from '@/lib/auth/adminSession';
import { getRag, ragEnabled } from '@/lib/rag';
import { IngestError, ingestDocument } from '@/lib/rag/ingest';
import { MAX_UPLOAD_BYTES } from '@/lib/rag/parser';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_TITLE_CHARS = 200;
const MAX_LOAN_TYPES = 20;
const MULTIPART_OVERHEAD_BYTES = 1024 * 1024;

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!ragEnabled()) return NextResponse.json({ error: 'RAG is not enabled' }, { status: 503 });
  const rag = getRag();
  await rag.ready;
  return NextResponse.json({ documents: await rag.store.listDocs() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  if (!ragEnabled()) return NextResponse.json({ error: 'RAG is not enabled' }, { status: 503 });

  // Reject oversized uploads from the declared length, before buffering the body.
  const declaredBytes = Number(request.headers.get('content-length') ?? 0);
  if (declaredBytes > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return NextResponse.json({ error: 'File is larger than 20 MB' }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = form.get('file');
  const title = String(form.get('title') ?? '').trim();
  const loanTypeIds = form.getAll('loanTypeIds').map(String).filter(Boolean);

  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
  if (title.length > MAX_TITLE_CHARS) {
    return NextResponse.json({ error: `title must be at most ${MAX_TITLE_CHARS} characters` }, { status: 400 });
  }
  if (loanTypeIds.length === 0) return NextResponse.json({ error: 'loanTypeIds is required' }, { status: 400 });
  if (loanTypeIds.length > MAX_LOAN_TYPES) {
    return NextResponse.json({ error: `at most ${MAX_LOAN_TYPES} loan types per document` }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'File is larger than 20 MB' }, { status: 413 });

  const rag = getRag();
  await rag.ready;
  const id = randomUUID();
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestDocument(
      { store: rag.store, embedder: rag.embedder },
      { id, title, filename: file.name, loanTypeIds, buffer }
    );
    return NextResponse.json({ id, status: 'ready', chunks: result.chunks }, { status: 201 });
  } catch (error) {
    if (error instanceof IngestError) {
      const status = error.code === 'EMBEDDING_FAILED' ? 502 : error.code === 'STORE_FAILED' ? 500 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error('rag_ingest_unexpected', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 });
  }
}
