import neo4j from 'neo4j-driver';
import { createOpenAIEmbedder } from '../src/lib/rag/embeddings';
import { indexFieldHelp } from '../src/lib/rag/fieldHelp';
import { createStore } from '../src/lib/rag/store';

async function main() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'password')
  );
  try {
    const store = createStore(driver);
    await store.ensureSchema();
    const embedder = createOpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY ?? '' });
    const { fields } = await indexFieldHelp({ store, embedder });
    console.log(`Indexed help text for ${fields} fields`);
  } finally {
    await driver.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
