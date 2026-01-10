import { NextRequest, NextResponse } from 'next/server';
import { neo4jConfigService } from '@/lib/services/Neo4jConfigService';
import { Integer } from 'neo4j-driver';

// Helper function to convert Neo4j integers to JavaScript numbers
function convertNeo4jIntegers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Check if it's a Neo4j Integer
  if (obj && typeof obj === 'object' && 'low' in obj && 'high' in obj) {
    return obj.low;
  }
  
  // Recursively process arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertNeo4jIntegers(item));
  }
  
  // Recursively process objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertNeo4jIntegers(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const loanTypeId = searchParams.get('loanTypeId');

  if (!loanTypeId) {
    return NextResponse.json(
      { error: 'loanTypeId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const config = await neo4jConfigService.getLoanTypeConfig(loanTypeId);

    if (!config) {
      return NextResponse.json(
        { error: 'Loan type configuration not found' },
        { status: 404 }
      );
    }

    // Convert Neo4j integers to JavaScript numbers
    const convertedConfig = convertNeo4jIntegers(config);

    return NextResponse.json(convertedConfig);
  } catch (error: any) {
    console.error('Error fetching loan configuration:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
