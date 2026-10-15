import neo4j, { Driver } from 'neo4j-driver';
import { aiClient } from '@/lib/ai/client';
import { config } from '@/lib/config';
import { createOpenAIEmbedder, type Embedder } from './embeddings';
import { createRagService, type RagService } from './service';
import { createStore, type RagStore } from './store';
import { RateLimiter } from './rateLimit';

interface RagRuntime {
  driver: Driver;
  store: RagStore;
  embedder: Embedder;
  service: RagService;
  limiter: RateLimiter;
  ready: Promise<void>;
}

const globalForRag = globalThis as unknown as { __ragRuntime?: RagRuntime };

export function ragEnabled(): boolean {
  return process.env.RAG_ENABLED === 'true';
}

export function getRag(): RagRuntime {
  if (!globalForRag.__ragRuntime) {
    const driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
    );
    const store = createStore(driver);
    const embedder = createOpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY ?? '' });
    const service = createRagService({
      embedder,
      store,
      llm: aiClient,
      minScore: Number(process.env.RAG_MIN_SCORE ?? '0.65'),
    });
    const ready = store.ensureSchema().catch(async (error) => {
      // Neo4j was not reachable yet: drop this runtime so the next request retries from scratch
      // instead of reusing a rejected promise for the life of the process.
      if (globalForRag.__ragRuntime?.driver === driver) globalForRag.__ragRuntime = undefined;
      await driver.close().catch(() => {});
      throw error;
    });
    ready.catch(() => {}); // callers await `ready`; this only prevents an unhandled-rejection crash
    globalForRag.__ragRuntime = {
      driver,
      store,
      embedder,
      service,
      limiter: new RateLimiter({ limit: 10, windowMs: 60_000 }),
      ready,
    };
  }
  return globalForRag.__ragRuntime;
}
