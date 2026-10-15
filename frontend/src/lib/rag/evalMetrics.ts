export interface EvalCase {
  id: string;
  loanTypeId: string;
  question: string;
  type: 'answer' | 'abstain';
  expectSource?: string;
}

export interface EvalOutcome {
  id: string;
  type: 'answer' | 'abstain';
  abstained: boolean;
  titles: string[];
  expectSource?: string;
  ungroundedCount: number;
}

const rate = (num: number, den: number) => (den === 0 ? 0 : num / den);

export function scoreOutcomes(outcomes: EvalOutcome[]) {
  const failures: string[] = [];
  const answers = outcomes.filter((o) => o.type === 'answer');
  const abstains = outcomes.filter((o) => o.type === 'abstain');

  let answerHits = 0;
  for (const o of answers) {
    const hit = !o.abstained && !!o.expectSource && o.titles.some((t) => t.includes(o.expectSource!));
    if (hit) answerHits++;
    else failures.push(o.id);
  }

  let abstainHits = 0;
  for (const o of abstains) {
    if (o.abstained) abstainHits++;
    else failures.push(o.id);
  }

  const valid = outcomes.filter((o) => o.ungroundedCount === 0).length;

  return {
    total: outcomes.length,
    answerHitRate: rate(answerHits, answers.length),
    abstainCorrectRate: rate(abstainHits, abstains.length),
    citationValidityRate: rate(valid, outcomes.length),
    failures,
  };
}
