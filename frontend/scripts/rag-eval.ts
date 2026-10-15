import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import neo4j from 'neo4j-driver';
import { aiClient } from '../src/lib/ai/client';
import { createOpenAIEmbedder } from '../src/lib/rag/embeddings';
import { scoreOutcomes, type EvalCase, type EvalOutcome } from '../src/lib/rag/evalMetrics';
import { ingestDocument } from '../src/lib/rag/ingest';
import { createRagService } from '../src/lib/rag/service';
import { createStore } from '../src/lib/rag/store';
import { retrieve } from '../src/lib/rag/retrieve';

const ROOT = path.resolve(__dirname, '..');

const FIXTURES = [
  { id: 'fixture-sba', file: 'sba-overview.md', title: 'Harbor Lane Small Business Term Loan', loanTypeIds: ['sba'] },
  { id: 'fixture-mca', file: 'mca-overview.md', title: 'Northgate Merchant Advance', loanTypeIds: ['mca'] },
];

async function main() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'password')
  );
  try {
    const store = createStore(driver);
    await store.ensureSchema();
    const embedder = createOpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY ?? '' });

    for (const f of FIXTURES) {
      await store.deleteDoc(f.id);
      await ingestDocument(
        { store, embedder },
        {
          id: f.id,
          title: f.title,
          filename: f.file,
          loanTypeIds: f.loanTypeIds,
          buffer: fs.readFileSync(path.join(ROOT, 'eval', 'fixtures', f.file)),
        }
      );
    }

    const minScore = Number(process.env.RAG_MIN_SCORE ?? '0.65');
    const service = createRagService({ embedder, store, llm: aiClient, minScore });
    const { cases } = yaml.load(
      fs.readFileSync(path.join(ROOT, 'eval', 'rag-eval.yaml'), 'utf8')
    ) as { cases: EvalCase[] };

    const outcomes: EvalOutcome[] = [];
    for (const c of cases) {
      const retrieved = await retrieve({ embedder, store }, { question: c.question, loanTypeId: c.loanTypeId });
      const result = await service.ask({ loanTypeId: c.loanTypeId, question: c.question });
      outcomes.push({
        id: c.id,
        type: c.type,
        abstained: result.abstained,
        titles: retrieved.map((r) => r.docTitle),
        expectSource: c.expectSource,
        ungroundedCount: result.ungroundedIds.length,
      });
    }

    const summary = scoreOutcomes(outcomes);
    const report = {
      ranAt: new Date().toISOString(),
      minScore,
      model: process.env.ANTHROPIC_MODEL ?? 'default',
      summary,
      outcomes,
    };
    const dir = path.join(ROOT, 'eval', 'results');
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, `rag-eval-${report.ranAt.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(out, JSON.stringify(report, null, 2));

    console.log(JSON.stringify(summary, null, 2));
    console.log(`Report written to ${out}`);
    process.exitCode = summary.failures.length === 0 ? 0 : 1;
  } finally {
    await driver.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
