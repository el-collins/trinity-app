import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFieldSchema, validateField } from './schemaGenerator';
import type { FormField } from '../types/schema';

const field = (over: Record<string, unknown>): FormField =>
  ({ id: 'f', name: 'f', label: 'Field', type: 'text', required: true, order: 1, validation: ['required'], ...over }) as unknown as FormField;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('generateFieldSchema', () => {
  it('requires a valid email for email fields', () => {
    const s = generateFieldSchema(field({ type: 'email' }));
    expect(s.safeParse('a@b.co').success).toBe(true);
    expect(s.safeParse('nope').success).toBe(false);
  });

  it('coerces numeric strings for number fields and rejects non-numbers', () => {
    const s = generateFieldSchema(field({ type: 'number' }));
    expect(s.safeParse('42').success).toBe(true);
    expect(s.safeParse('abc').success).toBe(false);
  });

  it('accepts 0 for a required number field', () => {
    const s = generateFieldSchema(field({ type: 'number' }));
    expect(s.safeParse(0).success).toBe(true);
  });

  it('enforces the ssn rule format', () => {
    const s = generateFieldSchema(field({ type: 'ssn', validation: ['required', 'ssn'] }));
    expect(s.safeParse('123-45-6789').success).toBe(true);
    expect(s.safeParse('123456789').success).toBe(true);
    expect(s.safeParse('123').success).toBe(false);
  });

  it('allows empty, null and undefined for optional fields', () => {
    const s = generateFieldSchema(field({ required: false, validation: [] }));
    expect(s.safeParse('').success).toBe(true);
    expect(s.safeParse(undefined).success).toBe(true);
    expect(s.safeParse(null).success).toBe(true);
  });
});

describe('validateField', () => {
  it('returns the required message for an empty required text field', () => {
    expect(validateField(field({ label: 'First Name' }), '')).toBe('First Name is required');
  });

  it('returns null for a valid value', () => {
    expect(validateField(field({}), 'hello')).toBeNull();
  });

  it('treats undefined as empty for a required field', () => {
    expect(validateField(field({}), undefined)).toBeTruthy();
  });
});
