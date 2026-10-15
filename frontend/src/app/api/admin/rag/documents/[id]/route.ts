import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth/adminSession';
import { getRag, ragEnabled } from '@/lib/rag';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ragEnabled()) return NextResponse.json({ error: 'RAG is not enabled' }, { status: 503 });

  const { id } = await params;
  const rag = getRag();
  await rag.ready;
  await rag.store.deleteDoc(id);
  await rag.store.bumpCorpusVersion();
  return NextResponse.json({ ok: true });
}
