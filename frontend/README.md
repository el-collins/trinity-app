# TrinityIQ SmartForm

Dynamic loan-application forms driven by a Neo4j knowledge graph, with a RAG assistant that answers applicant questions from loan documents.

## How it works

- **Form logic is data.** Loan types, fields and conditional rules live in Neo4j (`LoanType`, `Field`, `REQUIRES_FIELD`, `CONDITIONALLY_SHOWS`). The API reads the config, the form renders from it, and the Zod validation schema is generated from the same config.
- **RAG.** Admins upload loan documents (PDF, DOCX, TXT, MD). They are chunked (about 375 words, 45 overlap, page-aware), embedded with OpenAI `text-embedding-3-small` and stored as `Chunk` nodes with a Neo4j vector index. A question is embedded and retrieval is filtered to the applicant's loan type through the graph (`(:LoanDoc)-[:DESCRIBES]->(:LoanType)`). The model (Claude by default) answers only from the retrieved text with `[doc N]` citations; citations are validated in code, and the assistant abstains when the documents do not contain the answer.
- **Field help.** Each field's existing `help_text` is embedded too, so a question asked from a field is answered with that field's help ranked first.

```
 form graph:      LoanType -REQUIRES_FIELD-> Field <-HELPS- Chunk(field_help)
 documents:       LoanDoc -DESCRIBES-> LoanType     Chunk(loan_doc) -PART_OF-> LoanDoc
 question flow:   embed -> vector search (scoped by loan type) -> prompt -> Claude -> validate citations -> answer | abstain
```

## Run locally

```bash
cp .env.docker.example .env.docker     # from the repo root; fill in keys, set a local Neo4j password
docker compose --env-file .env.docker up --build
```

App: http://localhost:3000 — Neo4j Browser: http://localhost:7474. The `neo4j-seed` service loads `db/seed/*.cypher` once (it skips if loan types already exist).

Without Docker: `bun install`, point `NEO4J_*` at a Neo4j 5.13+ instance, then `bun run dev`.

## Index documents

```bash
bun run rag:ingest -- eval/fixtures/sba-overview.md sba "Sample SBA overview"
bun run rag:field-help          # embed every Field.help_text
```

Admins can also upload from `/admin/knowledge-base`. Admin RAG endpoints require a signed admin session cookie or the `x-rag-admin-key` header (`RAG_ADMIN_KEY`).

## Scripts

| Script | Purpose |
|---|---|
| `test` | unit tests (vitest) |
| `test:integration` | tests against a live Neo4j (`NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`) |
| `typecheck`, `lint`, `build` | static checks and production build |
| `rag:ingest`, `rag:field-help` | build the index |
| `rag:eval` | run the RAG eval set against live OpenAI and Anthropic (needs keys) |
| `graph:validate` | check field types, conditional rules and loan types in the graph |

## Quality

- Unit tests cover chunking, embedding, ingest (including failure cleanup), retrieval scoping, answering and citation checks, input validation, the HTTP APIs and the admin guard.
- LLM calls retry up to 2 times with backoff on network errors, timeouts, 429 and 5xx, and log metadata only (never question text).
- Answers are cached per instance and the cache is invalidated whenever the document set changes.
- CI runs lint (new code), typecheck, tests, build, a Docker build, graph validation and the Neo4j integration tests.
- Eval: `eval/rag-eval.yaml` has 15 cases (answer vs abstain, including cross-loan and prompt-injection questions) over fictional fixtures. **No results are published yet** — run `bun run rag:eval` and tune `RAG_MIN_SCORE` (default 0.65) before relying on the abstention threshold.

## Known limitations

- The answer cache and rate limiter are in memory, per instance.
- No OCR: scanned PDFs are rejected with a clear error.
- Vector search takes a 200-candidate pool before graph filtering, so a loan type with very few chunks in a very large corpus could return fewer results.
- Existing `/api/admin/*` routes (users, applications, export) have no server-side authentication. Tracked separately; the new RAG admin routes are guarded.
- Applicant uploads are not indexed (PII; needs client sign-off).
- The repo has many pre-existing lint errors; CI lints only the code added with the RAG work.
