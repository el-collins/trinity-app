import { describe, it, expect, vi } from 'vitest';
import { indexFieldHelp, fieldHelpText } from './fieldHelp';

describe('fieldHelpText', () => {
  it('prefixes the label', () => {
    expect(fieldHelpText({ id: 'ein', label: 'EIN', helpText: 'Federal Employer Identification Number' })).toBe(
      'EIN: Federal Employer Identification Number'
    );
  });
});

describe('indexFieldHelp', () => {
  it('embeds each field help text, replaces old chunks and bumps the corpus version once', async () => {
    const store = {
      listFieldsWithHelp: vi.fn(async () => [
        { id: 'ein', label: 'EIN', helpText: 'Federal Employer Identification Number' },
        { id: 'fico', label: 'Credit score', helpText: 'Credit range (300-900 for Canadian applicants)' },
      ]),
      replaceFieldHelp: vi.fn(async () => {}),
      bumpCorpusVersion: vi.fn(async () => 2),
    } as any;
    const embedder = { embed: vi.fn(async (t: string[]) => t.map(() => [0.1, 0.2])) };

    const out = await indexFieldHelp({ store, embedder });

    expect(out.fields).toBe(2);
    expect(embedder.embed).toHaveBeenCalledTimes(1);
    expect(store.replaceFieldHelp).toHaveBeenCalledTimes(2);
    expect(store.replaceFieldHelp).toHaveBeenCalledWith('ein', [
      { id: 'field:ein', text: 'EIN: Federal Employer Identification Number', page: 0, embedding: [0.1, 0.2] },
    ]);
    expect(store.bumpCorpusVersion).toHaveBeenCalledTimes(1);
  });

  it('does nothing and does not bump when no field has help text', async () => {
    const store = { listFieldsWithHelp: vi.fn(async () => []), replaceFieldHelp: vi.fn(), bumpCorpusVersion: vi.fn() } as any;
    const embedder = { embed: vi.fn() };
    expect((await indexFieldHelp({ store, embedder })).fields).toBe(0);
    expect(embedder.embed).not.toHaveBeenCalled();
    expect(store.bumpCorpusVersion).not.toHaveBeenCalled();
  });
});
