import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import neo4j from 'neo4j-driver';
import { createOpenAIEmbedder } from '../src/lib/rag/embeddings';
import { ingestDocument } from '../src/lib/rag/ingest';
import { createStore } from '../src/lib/rag/store';

async function main() {
  const [file, loanTypes, titleArg] = process.argv.slice(2);
  if (!file || !loanTypes) {
    console.error('Usage: npm run rag:ingest -- <file> <loanTypeId[,loanTypeId]> [title]');
    process.exit(1);
  }
  const driver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'password')
  );
  try {
    const store = createStore(driver);
    await store.ensureSchema();
    const embedder = createOpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY ?? '' });
    const result = await ingestDocument(
      { store, embedder },
      {
        id: randomUUID(),
        title: titleArg ?? path.basename(file),
        filename: path.basename(file),
        loanTypeIds: loanTypes.split(',').map((s) => s.trim()),
        buffer: fs.readFileSync(file),
      }
    );
    console.log(`Ingested ${result.chunks} chunks from ${file}`);
  } finally {
    await driver.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
