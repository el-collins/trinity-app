import type { Embedder } from './embeddings';
import type { RagStore } from './store';

export function fieldHelpText(f: { id: string; label: string; helpText: string }): string {
  return `${f.label}: ${f.helpText}`;
}

export async function indexFieldHelp(deps: {
  store: RagStore;
  embedder: Embedder;
}): Promise<{ fields: number }> {
  const fields = await deps.store.listFieldsWithHelp();
  if (fields.length === 0) return { fields: 0 };

  const texts = fields.map(fieldHelpText);
  const vectors = await deps.embedder.embed(texts);

  for (let i = 0; i < fields.length; i++) {
    await deps.store.replaceFieldHelp(fields[i].id, [
      { id: `field:${fields[i].id}`, text: texts[i], page: 0, embedding: vectors[i] },
    ]);
  }
  await deps.store.bumpCorpusVersion();
  return { fields: fields.length };
}
