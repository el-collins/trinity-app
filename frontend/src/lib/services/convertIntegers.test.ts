import { describe, it, expect } from 'vitest';
import neo4j from 'neo4j-driver';
import { convertIntegers } from './Neo4jConfigService';

describe('convertIntegers', () => {
  it('converts neo4j integers at any depth', () => {
    const out = convertIntegers({ a: neo4j.int(5), b: [neo4j.int(1), { c: neo4j.int(2) }], d: 'x', e: null });
    expect(out).toEqual({ a: 5, b: [1, { c: 2 }], d: 'x', e: null });
  });
});
