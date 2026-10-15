# RAG for TrinityIQ SmartForm: Design

Date: 2026-10-15
Status: draft, awaiting review

## Goal

Let an applicant ask questions while filling the loan form and get answers grounded in the client's loan documents, with citations, and an explicit refusal when the documents do not contain the answer.

Scope of this spec:
- Part 1: RAG core and loan product documents.
- Part 2: form-field help.
- Docker Compose setup so the whole stack (Neo4j, seeded graph, app) runs locally with one command.

Out of scope (separate project, needs client sign-off): RAG over applicant uploads (PII).
Also out of scope for v1: streaming answers, reranking, conversation memory beyond the current question.

## Constraints

- Real client feature, built in the local copy of `frontend/` (Next.js 16, API routes only, no Python service).
- Vector store: Neo4j native vector index (Neo4j 5.13+). Pinned image: `neo4j:5.26-community`.
- Embeddings: OpenAI `text-embedding-3-small` (1536 dims, cosine). Chat: existing Claude client in `src/lib/ai/client.ts` (provider stays switchable).
- Anthropic has no embeddings API, so `OPENAI_API_KEY` is required for ingest and query.
- Retrieval must be scoped to the applicant's selected loan type.
- No secrets in the repo or in the Docker image. Real client `.env` values are not copied into the compose setup.
- The repo has no test suite today; this work introduces one (vitest).

## Architecture

New module `frontend/src/lib/rag/`:

| File | Responsibility | Depends on |
|---|---|---|
| `chunker.ts` | Split text into ~500-token chunks, ~60 token overlap, keep page number | none |
| `parser.ts` | PDF and DOCX to text with page info (`pdf-parse`, `mammoth`) | libs |
| `embeddings.ts` | `embed(texts: string[]): number[][]`, batched, one retry on 429/5xx | OpenAI key |
| `store.ts` | Create the index, write chunks, vector query, delete a document | `neo4j-driver` |
| `ingest.ts` | parse, chunk, embed, store, set document status | the four above |
| `retrieve.ts` | embed the question, scoped vector search, return top 5 with scores | embeddings, store |
| `answer.ts` | Build the grounded prompt, call the Claude client, validate citations, abstain | `lib/ai/client.ts` |

Each file is testable alone. `answer.ts` and `retrieve.ts` take their dependencies as arguments so tests can pass mocks.

### Graph model

```
(:LoanDoc {id, title, filename, status, uploadedAt})-[:DESCRIBES]->(:LoanType)
(:Chunk {id, text, page, source, embedding})-[:PART_OF]->(:LoanDoc)
(:Chunk {source:'field_help'})-[:HELPS]->(:Field)
```

- `status` is one of `processing`, `ready`, `failed`.
- `source` is `loan_doc` or `field_help`.
- Vector index, created idempotently at first use:
  `CREATE VECTOR INDEX chunk_embedding IF NOT EXISTS FOR (c:Chunk) ON (c.embedding) OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}`
- Chunk IDs include the document ID and the chunk index, so repeated headings or repeated text cannot collide.

## Flows

### Ingest loan document (admin only)

`POST /api/admin/rag/documents` (multipart: file, loanTypeIds[], title)
1. Existing admin JWT check. Reject others with 401/403.
2. Validate: PDF or DOCX only, max 20 MB, title required, loan types must exist.
3. Create `LoanDoc` with `status: processing`.
4. Parse, chunk, embed in batches, write chunks.
5. Set `status: ready`, or `failed` with a stored error message. A failed document leaves no partial chunks (delete in the failure path).
6. Route sets `maxDuration` high enough for a 20 MB document. If the deployed host cannot run it, the ingest function is also callable from a CLI script (`npm run rag:ingest -- <file> <loanTypeId>`), which uses the same code.

Also: `GET /api/admin/rag/documents` (list with status), `DELETE /api/admin/rag/documents/:id` (removes doc and chunks).

### Ask a question (applicant)

`POST /api/rag/ask` body `{ loanTypeId, question, fieldId? }`
1. Validate: question 1 to 500 chars, loanTypeId exists.
2. Rate limit per IP (in-memory, 10 requests per minute; documented limitation for multi-instance).
3. Retrieve top 5 chunks scoped to the loan type (loan docs) plus, if `fieldId` is given, that field's help chunks.
4. If the best score is below a threshold (default 0.5, configurable), skip the model and return the fixed abstention answer.
5. Otherwise build the prompt. Retrieved text is wrapped in `<doc id="N">` tags and the prompt states it is data, not instructions.
6. Call the Claude client (30 s timeout already in the client).
7. Validate citations: every `[doc N]` in the answer must map to a retrieved chunk. Any other is stripped and reported in the response as `ungroundedIds`.
8. Response: `{ answer, citations: [{id, docTitle, page}], abstained, ungroundedIds }`.

Errors return a clear JSON error and HTTP code (400 validation, 429 rate limit, 502 embedding or model failure, 503 RAG disabled). The form keeps working when RAG fails.

### Part 2: field help

- Add optional `helpText` property to `Field` nodes in the graph.
- A script/admin endpoint embeds each `helpText` as a chunk with `source: 'field_help'` and a `[:HELPS]` link. Re-embedding replaces the old chunk.
- When the applicant opens the help control on a field, the UI calls `/api/rag/ask` with that `fieldId`. Field help chunks are ranked first, then loan document chunks fill remaining slots.

## UI

- `components/DynamicForm/AskPanel.tsx`: a collapsible panel (question box, answer, citations list, abstention message). Fits the existing Tailwind styling.
- Mounted in `DynamicFormContainer.tsx`, passing the selected `loanTypeId` and the current field.
- Gated by `NEXT_PUBLIC_ENABLE_RAG`, same pattern as the existing `NEXT_PUBLIC_ENABLE_AI_PLANNING`.
- A short notice under the box: do not enter SSN or other sensitive data in questions.
- Admin: new "Knowledge base" page under `/admin` (upload, list with status, delete, set loan types).

## Docker Compose

`docker-compose.yml` at the repo root:

| Service | Image / build | Notes |
|---|---|---|
| `neo4j` | `neo4j:5.26-community` | ports 7474, 7687; volume `trinity_neo4j_data`; healthcheck on bolt |
| `neo4j-seed` | `neo4j:5.26-community` (one-shot) | waits for healthy `neo4j`, runs `cypher-shell` over `Cypher scripts/02` to `11` (not `01`); idempotent guard: skip if `LoanType` nodes exist |
| `app` | build `frontend/Dockerfile` | depends on `neo4j-seed` completing; port 3000 |

- `frontend/Dockerfile`: multi-stage (deps, build, runtime) using Next.js `output: 'standalone'`. Runs as non-root. No `.env` copied into the image.
- `.env.docker.example` documents required variables. `.env.docker` is gitignored and holds local values. App container reads it via `env_file`. In compose, `NEO4J_URI=bolt://neo4j:7687`.
- Required variables: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (or the configured provider key), `NEXT_PUBLIC_ENABLE_RAG`, admin auth secrets. Firebase and GHL variables are only needed for the features that use them; the RAG path does not need them.
- Command: `docker compose --env-file .env.docker up --build`.
- Admin login for local use is seeded through env values in `.env.docker`, never the client's real admin credentials.

## Testing

Introduce `vitest` in `frontend/`.
- Unit: `chunker` (sizes, overlap, page numbers, repeated headings produce unique IDs), citation validation (valid, invalid, none), abstention threshold, prompt builder wraps text in `<doc>` tags.
- Unit with mocks: `retrieve` scoping and `answer` flow (mock embeddings and model).
- Integration (against compose Neo4j, run with `npm run test:integration`): ingest a small sample document, ask in-scope and out-of-scope questions, confirm scoping (a question about loan A never returns loan B chunks), confirm failed ingest leaves no chunks.
- Eval set: `eval/rag-eval.yaml` with ~15 cases (answer vs abstain, expected source document). `npm run rag:eval` writes a timestamped report. No accuracy claims are made until it has been run.
- Sample data: a few short, fictional loan documents in `eval/fixtures/` for tests and demos. Real client documents are never committed.

## Security and data handling

- Admin endpoints reuse the existing admin JWT; applicant endpoint is public but rate limited and length limited.
- Retrieved text is untrusted data (prompt injection defense via tags and instruction).
- Question text is not logged by default; only request metadata and timings.
- Client approval is required before real loan documents are sent to OpenAI for embeddings. Until then use fixtures.
- Part 3 (applicant uploads) is not built here.

## Quality hardening (added scope)

These close the gaps a reviewer would flag in the existing app.

### Tests and CI
- Tests as described in Testing, plus unit tests for existing logic with the highest risk: `schemaGenerator.ts` (required, format and conditional rules), `fieldDerivations.ts`, and `Neo4jConfigService` integer conversion.
- `.github/workflows/ci.yml` (the folder exists but is empty): on push and PR run install, `npm run lint`, `tsc --noEmit`, `vitest run`, `next build`, and `docker build` of `frontend/Dockerfile`. The integration job starts a `neo4j:5.26-community` service container, seeds it, and runs `test:integration`. `rag:eval` is not in CI (needs live model keys); it runs manually.
- No secrets in CI for the default job; model-calling tests use mocks.

### LLM client reliability (`src/lib/ai/client.ts`)
- Retry up to 2 times with exponential backoff and jitter on network errors, 429 and 5xx. No retry on 4xx validation errors or on timeouts that already used the full 30 s budget more than once.
- Shared by the existing `/api/ai/plan` and `/api/ai/suggest` routes and by RAG answers.
- Cache: in-memory LRU with TTL for RAG answers, keyed by hash of `(loanTypeId, normalized question, fieldId, corpus version)`. The corpus version changes whenever a document is added, deleted or re-ingested, so stale answers cannot be served. Cache is per instance and documented as such. No caching of `/api/ai/plan` (depends on applicant data).
- Structured logging of provider, latency, retries, cache hit, token counts when the provider returns them. No question or applicant text.
- Unit tests with a mocked `fetch`: retry on 503 then success, no retry on 400, cache hit/miss and invalidation on corpus version change.

### Evals
- RAG eval as specified above (answer and abstain cases, expected source document, citation validity rate, abstention rate). Report written to `eval/results/`.
- Small eval for `FormAgent.planNextSection` output shape (valid JSON against its type, only known section IDs) using recorded fixtures plus an optional live run.

### Graph data validation
- `npm run graph:validate`: checks every `Field` has a type from an allowed list (this class of error previously let `owner_ssn` ship as `text`), every conditional relationship points at existing fields, no loan type has an unreachable required field. Runs in CI against the seeded compose database.

### Documentation
- Replace the default `frontend/README.md` with: what the app is, architecture diagram (form graph + RAG), setup with `docker compose`, environment variables, scripts (`test`, `test:integration`, `rag:ingest`, `rag:eval`, `graph:validate`), and known limitations.

## Open items to confirm

1. Client approves OpenAI as the embedding processor for loan documents.
2. Production host and its function time limit (decides whether admin ingest runs in the request or via the CLI).
3. Whether `Field` nodes already carry any help text to reuse.
4. The score threshold (0.5) is a starting guess; tune it with the eval set.
