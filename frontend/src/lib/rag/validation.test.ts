import { describe, it, expect } from 'vitest';
import { validateAskInput, MAX_QUESTION_CHARS } from './validation';

const ok = { loanTypeId: 'sba', question: 'What is the rate?' };

describe('validateAskInput', () => {
  it('accepts a valid body and trims the question', () => {
    const r = validateAskInput({ ...ok, question: '  hi  ' });
    expect(r).toEqual({ ok: true, value: { loanTypeId: 'sba', question: 'hi' } });
  });

  it('passes fieldId through', () => {
    const r = validateAskInput({ ...ok, fieldId: 'ein' });
    expect(r.ok && r.value.fieldId).toBe('ein');
  });

  it.each([
    [null], [undefined], ['str'], [42], [[]],
    [{ loanTypeId: 'sba' }],
    [{ question: 'q' }],
    [{ loanTypeId: 'sba', question: '' }],
    [{ loanTypeId: 'sba', question: '   ' }],
    [{ loanTypeId: 'sba', question: 123 }],
    [{ loanTypeId: '', question: 'q' }],
    [{ loanTypeId: 'sba', question: 'q', fieldId: 5 }],
  ])('rejects %j', (body) => {
    expect(validateAskInput(body as unknown).ok).toBe(false);
  });

  it('rejects a question over the limit but accepts exactly the limit', () => {
    expect(validateAskInput({ ...ok, question: 'a'.repeat(MAX_QUESTION_CHARS + 1) }).ok).toBe(false);
    expect(validateAskInput({ ...ok, question: 'a'.repeat(MAX_QUESTION_CHARS) }).ok).toBe(true);
  });

  it('rejects ids with unexpected characters', () => {
    expect(validateAskInput({ loanTypeId: "sba' OR 1=1", question: 'q' }).ok).toBe(false);
  });
});
