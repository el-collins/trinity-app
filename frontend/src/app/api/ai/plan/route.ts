import { NextRequest, NextResponse } from 'next/server';
import { formAgent } from '@/lib/ai/agent';

/**
 * AI Planning API
 * 
 * POST /api/ai/plan
 * 
 * Uses AI to determine the next best action in the form flow
 */
export async function POST(request: NextRequest) {
  try {
    const context = await request.json();

    const decision = await formAgent.planNextSection(context);

    return NextResponse.json(decision);
  } catch (error) {
    console.error('AI planning error:', error);
    return NextResponse.json(
      { 
        error: 'AI planning failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
