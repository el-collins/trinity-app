import { describe, it, expect } from 'vitest';
import { chunkPages } from './chunker';

const words = (n: number, prefix = 'w') => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(' ');

describe('chunkPages', () => {
  it('returns one chunk for a short page', () => {
    const out = chunkPages([{ page: 1, text: 'hello world' }]);
    expect(out).toEqual([{ index: 0, page: 1, text: 'hello world' }]);
  });

  it('skips empty and whitespace-only pages', () => {
    const out = chunkPages([{ page: 1, text: '   \n ' }, { page: 2, text: 'real text' }]);
    expect(out).toHaveLength(1);
    expect(out[0].page).toBe(2);
  });

  it('splits long text with overlap', () => {
    const out = chunkPages([{ page: 1, text: words(1000) }], { maxWords: 100, overlapWords: 10 });
    expect(out.length).toBeGreaterThan(9);
    const firstTail = out[0].text.split(' ').slice(-10);
    const secondHead = out[1].text.split(' ').slice(0, 10);
    expect(secondHead).toEqual(firstTail);
    expect(out[0].text.split(' ')).toHaveLength(100);
  });

  it('never crosses page boundaries and keeps page numbers', () => {
    const out = chunkPages(
      [{ page: 3, text: words(30, 'a') }, { page: 4, text: words(30, 'b') }],
      { maxWords: 20, overlapWords: 5 }
    );
    expect(out.filter((c) => c.page === 3).every((c) => !c.text.includes('b'))).toBe(true);
    expect(out.filter((c) => c.page === 4).every((c) => !c.text.includes('a'))).toBe(true);
  });

  it('gives sequential unique indexes across the whole document', () => {
    const out = chunkPages(
      [{ page: 1, text: words(50) }, { page: 2, text: words(50) }],
      { maxWords: 20, overlapWords: 5 }
    );
    expect(out.map((c) => c.index)).toEqual(out.map((_, i) => i));
  });

  it('handles identical repeated text without producing duplicate indexes', () => {
    const same = words(40, 'x');
    const out = chunkPages([{ page: 1, text: same }, { page: 2, text: same }], { maxWords: 20, overlapWords: 5 });
    expect(new Set(out.map((c) => c.index)).size).toBe(out.length);
  });

  it('throws when overlap is not smaller than max', () => {
    expect(() => chunkPages([{ page: 1, text: 'a b' }], { maxWords: 10, overlapWords: 10 })).toThrow();
  });
});
