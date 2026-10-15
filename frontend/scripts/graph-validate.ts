import neo4j from 'neo4j-driver';
import { findGraphIssues } from '../src/lib/graph/validate';

async function main() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER ?? 'neo4j', process.env.NEO4J_PASSWORD ?? 'password')
  );
  const session = driver.session();
  try {
    const fields = (await session.run(`MATCH (f:Field) RETURN f.id AS id, f.type AS type`)).records.map((r) => ({
      id: r.get('id'),
      type: r.get('type'),
    }));
    const conditions = (
      await session.run(
        `MATCH (a:Field)-[r:CONDITIONALLY_SHOWS]->(b:Field) RETURN a.id AS fromId, b.id AS toId, r.when AS when, r.operator AS operator`
      )
    ).records.map((r) => ({
      fromId: r.get('fromId'),
      toId: r.get('toId'),
      when: r.get('when'),
      operator: r.get('operator'),
    }));
    const loanTypesWithoutFields = (
      await session.run(`MATCH (l:LoanType) WHERE NOT (l)-[:REQUIRES_FIELD]->(:Field) RETURN l.id AS id`)
    ).records.map((r) => r.get('id') as string);

    const issues = findGraphIssues({ fields, conditions, loanTypesWithoutFields });
    if (issues.length === 0) {
      console.log(`Graph OK: ${fields.length} fields, ${conditions.length} conditions`);
    } else {
      issues.forEach((i) => console.error(`- ${i}`));
      process.exitCode = 1;
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
