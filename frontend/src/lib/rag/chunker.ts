import type { Chunk, PageText } from './types';

export type { Chunk, PageText } from './types';

export const CHUNK_MAX_WORDS = 375;
export const CHUNK_OVERLAP_WORDS = 45;

export function chunkPages(
  pages: PageText[],
  opts: { maxWords?: number; overlapWords?: number } = {}
): Chunk[] {
  const maxWords = opts.maxWords ?? CHUNK_MAX_WORDS;
  const overlapWords = opts.overlapWords ?? CHUNK_OVERLAP_WORDS;
  if (overlapWords >= maxWords) throw new Error('overlapWords must be smaller than maxWords');

  const step = maxWords - overlapWords;
  const chunks: Chunk[] = [];

  for (const { page, text } of pages) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    for (let start = 0; start < words.length; start += step) {
      const slice = words.slice(start, start + maxWords);
      chunks.push({ index: chunks.length, page, text: slice.join(' ') });
      if (start + maxWords >= words.length) break;
    }
  }
  return chunks;
}
