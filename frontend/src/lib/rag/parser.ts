import path from 'node:path';
import type { PageText } from './types';

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type IngestErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'TOO_LARGE'
  | 'NO_TEXT'
  | 'UNKNOWN_LOAN_TYPE'
  | 'EMBEDDING_FAILED'
  | 'STORE_FAILED';

export class IngestError extends Error {
  constructor(public code: IngestErrorCode, message: string) {
    super(message);
    this.name = 'IngestError';
  }
}

export async function parseDocument(buffer: Buffer, filename: string): Promise<PageText[]> {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new IngestError('UNSUPPORTED_TYPE', `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new IngestError('TOO_LARGE', 'File is larger than 20 MB');
  }

  if (ext === '.txt' || ext === '.md') {
    return [{ page: 0, text: buffer.toString('utf8') }];
  }

  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer });
    return [{ page: 0, text: value }];
  }

  const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const pages: PageText[] = [];
  // Copy into a plain Uint8Array: small Node Buffers share a pooled ArrayBuffer with a
  // non-zero byteOffset, which pdf.js ignores, so it would read the wrong bytes.
  await pdf(new Uint8Array(buffer), {
    pagerender: async (page) => {
      const content = await page.getTextContent();
      const text = content.items.map((i) => i.str).join(' ');
      pages.push({ page: pages.length + 1, text });
      return text;
    },
  });
  return pages;
}
