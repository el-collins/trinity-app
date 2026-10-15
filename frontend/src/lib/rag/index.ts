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
    globalForRag.__ragRuntime = {
      driver,
      store,
      embedder,
      service,
      limiter: new RateLimiter({ limit: 10, windowMs: 60_000 }),
      ready: store.ensureSchema(),
    };
  }
  return globalForRag.__ragRuntime;
}
