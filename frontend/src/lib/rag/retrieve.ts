import type { Embedder } from './embeddings';
import type { RagStore } from './store';
import type { RetrievedChunk } from './types';

export const TOP_K = 5;
const MAX_FIELD_HELP = 2;

export async function retrieve(
  deps: { embedder: Embedder; store: RagStore },
  p: { question: string; loanTypeId: string; fieldId?: string; k?: number }
): Promise<RetrievedChunk[]> {
  const k = p.k ?? TOP_K;
  const [vector] = await deps.embedder.embed([p.question]);

  const help = p.fieldId ? await deps.store.searchFieldHelp(vector, p.fieldId, MAX_FIELD_HELP) : [];
  const loan = await deps.store.searchLoanDocs(vector, p.loanTypeId, k);

  const seen = new Set<string>();
  const out: RetrievedChunk[] = [];
  for (const c of [...help.slice(0, MAX_FIELD_HELP), ...loan]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
    if (out.length === k) break;
  }
  return out;
}
