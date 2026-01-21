import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker health checks and monitoring
 */
export async function GET() {
  try {
    // You can add more health checks here
    // For example: check database connection, external APIs, etc.
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
