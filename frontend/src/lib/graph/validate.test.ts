import { describe, it, expect } from 'vitest';
import { findGraphIssues } from './validate';

const base = { fields: [{ id: 'a', type: 'text' }, { id: 'b', type: 'ssn' }], conditions: [], loanTypesWithoutFields: [] };

describe('findGraphIssues', () => {
  it('returns no issues for a valid graph', () => {
    expect(findGraphIssues(base)).toEqual([]);
  });

  it('flags a field with an unknown or missing type', () => {
    const issues = findGraphIssues({ ...base, fields: [{ id: 'owner_ssn', type: 'txt' }, { id: 'x', type: null }] });
    expect(issues).toEqual([
      'Field "owner_ssn" has unknown type "txt"',
      'Field "x" has no type',
    ]);
  });

  it('flags conditions with a missing operator or when', () => {
    const issues = findGraphIssues({
      ...base,
      conditions: [{ fromId: 'a', toId: 'b', when: null, operator: 'equals' }, { fromId: 'a', toId: 'b', when: 'Yes', operator: 'bogus' }],
    });
    expect(issues).toEqual([
      'Condition a -> b is missing "when"',
      'Condition a -> b has unknown operator "bogus"',
    ]);
  });

  it('flags loan types that have no fields', () => {
    expect(findGraphIssues({ ...base, loanTypesWithoutFields: ['ghost'] })).toEqual(['Loan type "ghost" has no required fields']);
  });
});
