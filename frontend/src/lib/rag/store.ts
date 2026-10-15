import type { Driver } from 'neo4j-driver';
import neo4j from 'neo4j-driver';
import { EMBEDDING_DIMENSIONS } from './embeddings';
import type { RetrievedChunk } from './types';

export interface LoanDocSummary {
  id: string;
  title: string;
  filename: string;
  status: 'processing' | 'ready' | 'failed';
  error?: string;
  uploadedAt: string;
  loanTypeIds: string[];
  chunkCount: number;
}

export interface StoredChunk {
  id: string;
  text: string;
  page: number;
  embedding: number[];
}

export interface RagStore {
  ensureSchema(): Promise<void>;
  loanTypesExist(ids: string[]): Promise<boolean>;
  createDoc(d: { id: string; title: string; filename: string; loanTypeIds: string[] }): Promise<void>;
  addChunks(docId: string, chunks: StoredChunk[]): Promise<void>;
  deleteChunks(docId: string): Promise<void>;
  setDocStatus(docId: string, status: 'processing' | 'ready' | 'failed', error?: string): Promise<void>;
  deleteDoc(docId: string): Promise<void>;
  listDocs(): Promise<LoanDocSummary[]>;
  searchLoanDocs(embedding: number[], loanTypeId: string, k: number): Promise<RetrievedChunk[]>;
  searchFieldHelp(embedding: number[], fieldId: string, k: number): Promise<RetrievedChunk[]>;
  replaceFieldHelp(fieldId: string, chunks: StoredChunk[]): Promise<void>;
  listFieldsWithHelp(): Promise<{ id: string; label: string; helpText: string }[]>;
  getCorpusVersion(): Promise<number>;
  bumpCorpusVersion(): Promise<number>;
}

// The vector index returns a global top-N before graph filtering, so ask for a
// large candidate pool. Scoping is exact; recall is bounded by this pool size.
const CANDIDATE_POOL = 200;

const toNum = (v: unknown): number => (neo4j.isInt(v) ? (v as { toNumber(): number }).toNumber() : Number(v));

export function createStore(driver: Driver): RagStore {
  async function run<T>(fn: (s: ReturnType<Driver['session']>) => Promise<T>): Promise<T> {
    const session = driver.session();
    try {
      return await fn(session);
    } finally {
      await session.close();
    }
  }

  return {
    async ensureSchema() {
      await run(async (s) => {
        await s.run(`CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE`);
        await s.run(`CREATE CONSTRAINT loan_doc_id IF NOT EXISTS FOR (d:LoanDoc) REQUIRE d.id IS UNIQUE`);
        await s.run(
          `CREATE VECTOR INDEX chunk_embedding IF NOT EXISTS
           FOR (c:Chunk) ON (c.embedding)
           OPTIONS {indexConfig: {\`vector.dimensions\`: ${EMBEDDING_DIMENSIONS}, \`vector.similarity_function\`: 'cosine'}}`
        );
        await s.run(`MERGE (m:RagMeta {id:'corpus'}) ON CREATE SET m.version = 0`);
      });
    },

    async loanTypesExist(ids) {
      return run(async (s) => {
        const r = await s.run(`MATCH (l:LoanType) WHERE l.id IN $ids RETURN count(l) AS n`, { ids });
        return toNum(r.records[0].get('n')) === new Set(ids).size;
      });
    },

    async createDoc(d) {
      await run(async (s) => {
        await s.run(
          `CREATE (doc:LoanDoc {id:$id, title:$title, filename:$filename, status:'processing', uploadedAt:toString(datetime())})
           WITH doc
           MATCH (l:LoanType) WHERE l.id IN $loanTypeIds
           CREATE (doc)-[:DESCRIBES]->(l)`,
          d
        );
      });
    },

    async addChunks(docId, chunks) {
      if (chunks.length === 0) return;
      await run(async (s) => {
        await s.run(
          `MATCH (d:LoanDoc {id:$docId})
           UNWIND $chunks AS ch
           CREATE (c:Chunk {id: ch.id, text: ch.text, page: ch.page, source: 'loan_doc'})
           CREATE (c)-[:PART_OF]->(d)
           WITH c, ch
           CALL db.create.setNodeVectorProperty(c, 'embedding', ch.embedding)`,
          { docId, chunks }
        );
      });
    },

    async deleteChunks(docId) {
      await run((s) => s.run(`MATCH (c:Chunk)-[:PART_OF]->(:LoanDoc {id:$docId}) DETACH DELETE c`, { docId }));
    },

    async setDocStatus(docId, status, error) {
      await run((s) =>
        s.run(`MATCH (d:LoanDoc {id:$docId}) SET d.status = $status, d.error = $error`, {
          docId,
          status,
          error: error ?? null,
        })
      );
    },

    async deleteDoc(docId) {
      await run(async (s) => {
        await s.run(`MATCH (c:Chunk)-[:PART_OF]->(:LoanDoc {id:$docId}) DETACH DELETE c`, { docId });
        await s.run(`MATCH (d:LoanDoc {id:$docId}) DETACH DELETE d`, { docId });
      });
    },

    async listDocs() {
      return run(async (s) => {
        const r = await s.run(
          `MATCH (d:LoanDoc)
           OPTIONAL MATCH (d)-[:DESCRIBES]->(l:LoanType)
           OPTIONAL MATCH (c:Chunk)-[:PART_OF]->(d)
           RETURN d, collect(DISTINCT l.id) AS loanTypeIds, count(DISTINCT c) AS chunkCount
           ORDER BY d.uploadedAt DESC`
        );
        return r.records.map((rec) => {
          const d = rec.get('d').properties;
          return {
            id: d.id,
            title: d.title,
            filename: d.filename,
            status: d.status,
            error: d.error ?? undefined,
            uploadedAt: d.uploadedAt,
            loanTypeIds: rec.get('loanTypeIds'),
            chunkCount: toNum(rec.get('chunkCount')),
          } as LoanDocSummary;
        });
      });
    },

    async searchLoanDocs(embedding, loanTypeId, k) {
      return run(async (s) => {
        const r = await s.run(
          `CALL db.index.vector.queryNodes('chunk_embedding', $pool, $embedding) YIELD node AS c, score
           MATCH (c)-[:PART_OF]->(d:LoanDoc {status:'ready'})-[:DESCRIBES]->(:LoanType {id:$loanTypeId})
           RETURN c.id AS id, c.text AS text, c.page AS page, score, d.id AS docId, d.title AS docTitle
           ORDER BY score DESC LIMIT $k`,
          { pool: neo4j.int(CANDIDATE_POOL), embedding, loanTypeId, k: neo4j.int(k) }
        );
        return r.records.map((rec) => ({
          id: rec.get('id'),
          text: rec.get('text'),
          page: toNum(rec.get('page')),
          score: Number(rec.get('score')),
          docId: rec.get('docId'),
          docTitle: rec.get('docTitle'),
          source: 'loan_doc' as const,
        }));
      });
    },

    async searchFieldHelp(embedding, fieldId, k) {
      return run(async (s) => {
        const r = await s.run(
          `CALL db.index.vector.queryNodes('chunk_embedding', $pool, $embedding) YIELD node AS c, score
           MATCH (c {source:'field_help'})-[:HELPS]->(f:Field {id:$fieldId})
           RETURN c.id AS id, c.text AS text, score, f.id AS docId, f.label AS docTitle
           ORDER BY score DESC LIMIT $k`,
          { pool: neo4j.int(CANDIDATE_POOL), embedding, fieldId, k: neo4j.int(k) }
        );
        return r.records.map((rec) => ({
          id: rec.get('id'),
          text: rec.get('text'),
          page: 0,
          score: Number(rec.get('score')),
          docId: rec.get('docId'),
          docTitle: `Field help: ${rec.get('docTitle')}`,
          source: 'field_help' as const,
        }));
      });
    },

    async replaceFieldHelp(fieldId, chunks) {
      await run(async (s) => {
        await s.run(`MATCH (c:Chunk {source:'field_help'})-[:HELPS]->(:Field {id:$fieldId}) DETACH DELETE c`, { fieldId });
        if (chunks.length === 0) return;
        await s.run(
          `MATCH (f:Field {id:$fieldId})
           UNWIND $chunks AS ch
           CREATE (c:Chunk {id: ch.id, text: ch.text, page: 0, source: 'field_help'})
           CREATE (c)-[:HELPS]->(f)
           WITH c, ch
           CALL db.create.setNodeVectorProperty(c, 'embedding', ch.embedding)`,
          { fieldId, chunks }
        );
      });
    },

    async listFieldsWithHelp() {
      return run(async (s) => {
        const r = await s.run(
          `MATCH (f:Field) WHERE f.help_text IS NOT NULL AND trim(f.help_text) <> ''
           RETURN f.id AS id, coalesce(f.label, f.id) AS label, f.help_text AS helpText ORDER BY f.id`
        );
        return r.records.map((rec) => ({
          id: rec.get('id'),
          label: rec.get('label'),
          helpText: rec.get('helpText'),
        }));
      });
    },

    async getCorpusVersion() {
      return run(async (s) => {
        const r = await s.run(`MERGE (m:RagMeta {id:'corpus'}) ON CREATE SET m.version = 0 RETURN m.version AS v`);
        return toNum(r.records[0].get('v'));
      });
    },

    async bumpCorpusVersion() {
      return run(async (s) => {
        const r = await s.run(
          `MERGE (m:RagMeta {id:'corpus'}) ON CREATE SET m.version = 0 SET m.version = m.version + 1 RETURN m.version AS v`
        );
        return toNum(r.records[0].get('v'));
      });
    },
  };
}
