import { describe, it, expect } from 'vitest';
import { TTLCache, makeAnswerKey } from './cache';

describe('TTLCache', () => {
  it('returns stored values and expires them', () => {
    let t = 0;
    const c = new TTLCache<string>({ ttlMs: 100, now: () => t });
    c.set('a', 'x');
    expect(c.get('a')).toBe('x');
    t = 101;
    expect(c.get('a')).toBeUndefined();
  });

  it('evicts the least recently used entry beyond max', () => {
    const c = new TTLCache<number>({ max: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');
    c.set('c', 3);
    expect(c.get('b')).toBeUndefined();
    expect(c.get('a')).toBe(1);
    expect(c.get('c')).toBe(3);
  });
});

describe('makeAnswerKey', () => {
  const base = { loanTypeId: 'sba', question: 'What is  the RATE?', corpusVersion: 1 };
  it('normalizes case and whitespace', () => {
    expect(makeAnswerKey(base)).toBe(makeAnswerKey({ ...base, question: 'what is the rate?' }));
  });
  it('changes when the corpus version changes', () => {
    expect(makeAnswerKey(base)).not.toBe(makeAnswerKey({ ...base, corpusVersion: 2 }));
  });
  it('differs by loan type and field', () => {
    expect(makeAnswerKey(base)).not.toBe(makeAnswerKey({ ...base, loanTypeId: 'mca' }));
    expect(makeAnswerKey(base)).not.toBe(makeAnswerKey({ ...base, fieldId: 'ein' }));
  });
});
