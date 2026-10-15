import { createHash } from 'node:crypto';

export class TTLCache<V> {
  private store = new Map<string, { value: V; expires: number }>();
  private max: number;
  private ttlMs: number;
  private now: () => number;

  constructor(opts: { max?: number; ttlMs?: number; now?: () => number } = {}) {
    this.max = opts.max ?? 200;
    this.ttlMs = opts.ttlMs ?? 10 * 60 * 1000;
    this.now = opts.now ?? Date.now;
  }

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, hit); // refresh recency
    return hit.value;
  }

  set(key: string, value: V): void {
    this.store.delete(key);
    this.store.set(key, { value, expires: this.now() + this.ttlMs });
    while (this.store.size > this.max) {
      const oldest = this.store.keys().next().value as string;
      this.store.delete(oldest);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

export function makeAnswerKey(p: {
  loanTypeId: string;
  question: string;
  fieldId?: string;
  corpusVersion: number;
}): string {
  const normalized = p.question.toLowerCase().replace(/\s+/g, ' ').trim();
  return createHash('sha256')
    .update([p.loanTypeId, p.fieldId ?? '', p.corpusVersion, normalized].join('|'))
    .digest('hex');
}
