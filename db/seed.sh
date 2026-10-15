#!/bin/sh
# Idempotent seed: runs once, skips if LoanType nodes already exist.
set -e
URI="${NEO4J_URI:-bolt://neo4j:7687}"
COUNT=$(cypher-shell -a "$URI" -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" --format plain \
  "MATCH (l:LoanType) RETURN count(l)" | tail -n 1)
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
