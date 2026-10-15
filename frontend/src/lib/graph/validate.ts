export const ALLOWED_FIELD_TYPES = [
  'address', 'checkbox', 'currency', 'date', 'email', 'number', 'radio', 'select',
  'signature', 'ssn', 'tel', 'text', 'textarea', 'url', 'workbook',
];
export const ALLOWED_OPERATORS = ['equals'];

export interface FieldRow {
  id: string;
  type: string | null;
}
export interface ConditionRow {
  fromId: string;
  toId: string;
  when: unknown;
  operator: unknown;
}

export function findGraphIssues(input: {
  fields: FieldRow[];
  conditions: ConditionRow[];
  loanTypesWithoutFields: string[];
}): string[] {
  const issues: string[] = [];

  for (const f of input.fields) {
    if (!f.type) issues.push(`Field "${f.id}" has no type`);
    else if (!ALLOWED_FIELD_TYPES.includes(f.type.toLowerCase())) {
      issues.push(`Field "${f.id}" has unknown type "${f.type}"`);
    }
  }

  for (const c of input.conditions) {
    if (c.when === null || c.when === undefined || c.when === '') {
      issues.push(`Condition ${c.fromId} -> ${c.toId} is missing "when"`);
    }
    if (!ALLOWED_OPERATORS.includes(String(c.operator))) {
      issues.push(`Condition ${c.fromId} -> ${c.toId} has unknown operator "${String(c.operator)}"`);
    }
  }

  for (const id of input.loanTypesWithoutFields) {
    issues.push(`Loan type "${id}" has no required fields`);
  }
  return issues;
}
