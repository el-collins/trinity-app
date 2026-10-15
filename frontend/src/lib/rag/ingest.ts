import { chunkPages } from './chunker';
import { EmbeddingError, type Embedder } from './embeddings';
import { IngestError, MAX_UPLOAD_BYTES, ALLOWED_EXTENSIONS, parseDocument } from './parser';
import type { RagStore } from './store';
import path from 'node:path';

export { IngestError } from './parser';

const MIN_TEXT_CHARS = 50;

export async function ingestDocument(
  deps: { store: RagStore; embedder: Embedder },
  input: { id: string; title: string; filename: string; loanTypeIds: string[]; buffer: Buffer }
): Promise<{ chunks: number }> {
  const { store, embedder } = deps;

  const ext = path.extname(input.filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new IngestError('UNSUPPORTED_TYPE', `Unsupported file type "${ext}"`);
  }
  if (input.buffer.length > MAX_UPLOAD_BYTES) {
    throw new IngestError('TOO_LARGE', 'File is larger than 20 MB');
  }
  if (input.loanTypeIds.length === 0 || !(await store.loanTypesExist(input.loanTypeIds))) {
    throw new IngestError('UNKNOWN_LOAN_TYPE', 'One or more loan types do not exist');
  }

  await store.createDoc({
    id: input.id,
    title: input.title,
    filename: input.filename,
    loanTypeIds: input.loanTypeIds,
  });

  try {
    const pages = await parseDocument(input.buffer, input.filename);
    const totalChars = pages.reduce((n, p) => n + p.text.trim().length, 0);
    if (totalChars < MIN_TEXT_CHARS) {
      throw new IngestError(
        'NO_TEXT',
        'No extractable text found. Scanned PDFs need OCR first; this version does not do OCR.'
      );
    }

    const chunks = chunkPages(pages);
    const vectors = await embedder.embed(chunks.map((c) => c.text));
    await store.addChunks(
      input.id,
      chunks.map((c, i) => ({
        id: `${input.id}:${c.index}`,
        text: c.text,
        page: c.page,
        embedding: vectors[i],
      }))
    );
    await store.setDocStatus(input.id, 'ready');
    await store.bumpCorpusVersion();
    return { chunks: chunks.length };
  } catch (error) {
    await store.deleteChunks(input.id).catch(() => {});
    const wrapped =
      error instanceof IngestError
        ? error
        : error instanceof EmbeddingError
          ? new IngestError('EMBEDDING_FAILED', error.message)
          : new IngestError('STORE_FAILED', error instanceof Error ? error.message : 'Ingest failed');
    await store.setDocStatus(input.id, 'failed', wrapped.message).catch(() => {});
    throw wrapped;
  }
}
