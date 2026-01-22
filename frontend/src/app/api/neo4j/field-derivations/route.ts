import { NextResponse } from 'next/server';
import { neo4jConfigService } from '@/lib/services/Neo4jConfigService';

export async function GET() {
  try {
    const derivations = await neo4jConfigService.getFieldDerivations();

    return NextResponse.json(derivations);
  } catch (error: any) {
    console.error('Error fetching field derivations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
