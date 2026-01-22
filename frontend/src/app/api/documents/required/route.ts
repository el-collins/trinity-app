import { NextRequest, NextResponse } from 'next/server';
import { neo4jConfigService } from '@/lib/services/Neo4jConfigService';
import neo4j from 'neo4j-driver';

/**
 * Convert Neo4j integer objects to JavaScript numbers
 */
function convertNeo4jIntegers(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Handle Neo4j Integer objects
  if (neo4j.isInt(obj)) {
    return obj.toNumber();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertNeo4jIntegers);
  }

  // Handle objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertNeo4jIntegers(value);
    }
    return converted;
  }

  return obj;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loanTypeId = searchParams.get('loanTypeId');

    if (!loanTypeId) {
      return NextResponse.json(
        { error: 'loanTypeId is required' },
        { status: 400 }
      );
    }

    const query = `
      MATCH (lt:LoanType {id: $loanTypeId})-[:REQUIRES_DOCUMENT]->(d:Document)
      RETURN d {
        .*
      } AS document
      ORDER BY d.order
    `;

    const session = neo4jConfigService.getSession();
    try {
      const result = await session.run(query, { loanTypeId });
      const documents = result.records.map(r => convertNeo4jIntegers(r.get('document')));
      return NextResponse.json({ documents });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching required documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}