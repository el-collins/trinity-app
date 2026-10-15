import { describe, it, expect } from 'vitest';
import { scoreOutcomes, type EvalOutcome } from './evalMetrics';

const o = (p: Partial<EvalOutcome>): EvalOutcome => ({
  id: 'x', type: 'answer', abstained: false, titles: ['Harbor Lane Loan'], expectSource: 'Harbor Lane', ungroundedCount: 0, ...p,
});

describe('scoreOutcomes', () => {
  it('scores a perfect run', () => {
    const r = scoreOutcomes([o({}), o({ id: 'y', type: 'abstain', abstained: true, titles: [], expectSource: undefined })]);
    expect(r).toMatchObject({ answerHitRate: 1, abstainCorrectRate: 1, citationValidityRate: 1, failures: [] });
  });

  it('flags an answer case that abstained or cited the wrong source', () => {
    const r = scoreOutcomes([
      o({ id: 'a', abstained: true, titles: [] }),
      o({ id: 'b', titles: ['Other'] }),
    ]);
    expect(r.answerHitRate).toBe(0);
    expect(r.failures).toEqual(['a', 'b']);
  });

  it('flags an abstain case that answered', () => {
    const r = scoreOutcomes([o({ id: 'c', type: 'abstain', abstained: false, expectSource: undefined })]);
    expect(r.abstainCorrectRate).toBe(0);
    expect(r.failures).toEqual(['c']);
  });

  it('counts ungrounded citations against citation validity', () => {
    const r = scoreOutcomes([o({ ungroundedCount: 1 }), o({ id: 'z' })]);
    expect(r.citationValidityRate).toBe(0.5);
  });

  it('returns zeros safely for empty input', () => {
    expect(scoreOutcomes([])).toMatchObject({ total: 0, answerHitRate: 0, abstainCorrectRate: 0, citationValidityRate: 0 });
  });
});
