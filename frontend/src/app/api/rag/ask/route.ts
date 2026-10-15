import { NextRequest, NextResponse } from 'next/server';
import { getRag, ragEnabled } from '@/lib/rag';
import { RagInputError, RagUpstreamError } from '@/lib/rag/service';
import { validateAskInput } from '@/lib/rag/validation';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!ragEnabled()) {
    return NextResponse.json({ error: 'Question answering is not enabled' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const rag = getRag();
  const gate = rag.limiter.allow(ip);
  if (!gate.ok) {
    return NextResponse.json(
      { error: 'Too many questions. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = validateAskInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    try {
      await rag.ready;
    } catch (error) {
      // Neo4j not reachable yet: the runtime resets itself, so a later request retries.
      console.error('rag_not_ready', error instanceof Error ? error.message : 'unknown');
      return NextResponse.json({ error: 'Answering is temporarily unavailable' }, { status: 503 });
    }
    const result = await rag.service.ask(parsed.value);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RagInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof RagUpstreamError) {
      console.error('rag_upstream_error', error.message);
      return NextResponse.json({ error: 'Answering is temporarily unavailable' }, { status: 502 });
    }
    console.error('rag_unexpected_error', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
