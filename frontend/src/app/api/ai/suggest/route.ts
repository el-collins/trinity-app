import { NextRequest, NextResponse } from 'next/server';
import { formAgent } from '@/lib/ai/agent';

/**
 * AI Field Suggestion API
 * 
 * POST /api/ai/suggest
 * 
 * Provides intelligent field value suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const context = await request.json();

    const suggestion = await formAgent.suggestFieldValue(context);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { 
        error: 'AI suggestion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
