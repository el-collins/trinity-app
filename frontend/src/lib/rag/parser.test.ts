import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { parseDocument } from './parser';

async function buildPdf(pages: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create({ useObjectStreams: false } as never);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of pages) {
    doc.addPage([300, 100]).drawText(text, { x: 10, y: 50, size: 12, font });
  }
  return Buffer.from(await doc.save({ useObjectStreams: false }));
}

describe('parseDocument', () => {
  it('parses markdown and text as a single unknown-page entry', async () => {
    const out = await parseDocument(Buffer.from('# Title\n\nSome loan terms.'), 'terms.md');
    expect(out).toEqual([{ page: 0, text: '# Title\n\nSome loan terms.' }]);
  });

  it('rejects unsupported extensions', async () => {
    await expect(parseDocument(Buffer.from('x'), 'evil.exe')).rejects.toMatchObject({ code: 'UNSUPPORTED_TYPE' });
  });

  it('parses a PDF into per-page text', async () => {
    const out = await parseDocument(await buildPdf(['Hello loan terms', 'Second page rates']), 'a.pdf');
    expect(out).toHaveLength(2);
    expect(out[0].page).toBe(1);
    expect(out[0].text).toContain('Hello loan terms');
    expect(out[1].page).toBe(2);
    expect(out[1].text).toContain('Second page rates');
  });
});
