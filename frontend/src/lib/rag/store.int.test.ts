import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import neo4j, { Driver } from 'neo4j-driver';
import { createStore, RagStore } from './store';
import { EMBEDDING_DIMENSIONS } from './embeddings';

const unit = (i: number) => {
  const v = new Array(EMBEDDING_DIMENSIONS).fill(0);
  v[i] = 1;
  return v;
};

let driver: Driver;
let store: RagStore;

beforeAll(async () => {
  driver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'password')
  );
  store = createStore(driver);
  await store.ensureSchema();
  const s = driver.session();
  await s.run(`MERGE (:LoanType {id:'int_a'}) MERGE (:LoanType {id:'int_b'})`);
  await s.close();
});

afterAll(async () => {
  const s = driver.session();
  await s.run(`MATCH (c:Chunk)-[:PART_OF]->(d:LoanDoc) WHERE d.id STARTS WITH 'int-' DETACH DELETE c, d`);
  await s.run(`MATCH (d:LoanDoc) WHERE d.id STARTS WITH 'int-' DETACH DELETE d`);
  await s.run(`MATCH (l:LoanType) WHERE l.id IN ['int_a','int_b'] DETACH DELETE l`);
  await s.close();
  await driver.close();
});

describe('RagStore (integration)', () => {
  it('ensureSchema is idempotent', async () => {
    await store.ensureSchema();
    await store.ensureSchema();
  });

  it('scopes search to the requested loan type even when the other type is nearer', async () => {
    await store.createDoc({ id: 'int-doc-a', title: 'Doc A', filename: 'a.md', loanTypeIds: ['int_a'] });
    await store.createDoc({ id: 'int-doc-b', title: 'Doc B', filename: 'b.md', loanTypeIds: ['int_b'] });
    await store.addChunks('int-doc-a', [{ id: 'int-doc-a:0', text: 'far chunk A', page: 1, embedding: unit(1) }]);
    await store.addChunks('int-doc-b', [{ id: 'int-doc-b:0', text: 'near chunk B', page: 1, embedding: unit(0) }]);
    await store.setDocStatus('int-doc-a', 'ready');
    await store.setDocStatus('int-doc-b', 'ready');

    const hits = await store.searchLoanDocs(unit(0), 'int_a', 5);
    expect(hits.map((h) => h.docId)).toEqual(['int-doc-a']);
    expect(hits.every((h) => h.source === 'loan_doc')).toBe(true);
  });

  it('ignores documents that are not ready', async () => {
    await store.createDoc({ id: 'int-doc-p', title: 'Pending', filename: 'p.md', loanTypeIds: ['int_a'] });
    await store.addChunks('int-doc-p', [{ id: 'int-doc-p:0', text: 'pending text', page: 1, embedding: unit(2) }]);
    const hits = await store.searchLoanDocs(unit(2), 'int_a', 5);
    expect(hits.find((h) => h.docId === 'int-doc-p')).toBeUndefined();
  });

  it('rejects duplicate chunk ids', async () => {
    await expect(
      store.addChunks('int-doc-a', [{ id: 'int-doc-a:0', text: 'dup', page: 1, embedding: unit(3) }])
    ).rejects.toThrow();
  });

  it('deleteChunks removes chunks and keeps the document', async () => {
    await store.deleteChunks('int-doc-p');
    const docs = await store.listDocs();
    const p = docs.find((d) => d.id === 'int-doc-p');
    expect(p?.chunkCount).toBe(0);
  });

  it('deleteDoc removes the document and its chunks', async () => {
    await store.deleteDoc('int-doc-b');
    const docs = await store.listDocs();
    expect(docs.find((d) => d.id === 'int-doc-b')).toBeUndefined();
  });

  it('loanTypesExist reports unknown ids', async () => {
    expect(await store.loanTypesExist(['int_a'])).toBe(true);
    expect(await store.loanTypesExist(['int_a', 'nope'])).toBe(false);
  });

  it('bumpCorpusVersion increases the version', async () => {
    const before = await store.getCorpusVersion();
    const after = await store.bumpCorpusVersion();
    expect(after).toBe(before + 1);
  });
});
