#!/bin/sh
# Idempotent seed: runs once, skips if LoanType nodes already exist.
# Fails loudly if Neo4j cannot be queried, instead of mistaking an error for "already seeded".
set -e
URI="${NEO4J_URI:-bolt://neo4j:7687}"

OUT=$(cypher-shell -a "$URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" --format plain \
  "MATCH (l:LoanType) RETURN count(l)") || {
  echo "Seed failed: could not query Neo4j at $URI" >&2
  exit 1
}
COUNT=$(printf '%s\n' "$OUT" | tail -n 1)
case "$COUNT" in
  ''|*[!0-9]*) echo "Seed failed: unexpected count output: $OUT" >&2; exit 1 ;;
esac

if [ "$COUNT" != "0" ]; then
  echo "Seed skipped: $COUNT loan types already present."
  exit 0
fi
for f in /seed/0[2-9]-*.cypher /seed/1[0-1]-*.cypher; do
  case "$f" in *06-verification*) continue;; esac
  echo "Running $f"
  cypher-shell -a "$URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -f "$f"
done
echo "Seed complete."
