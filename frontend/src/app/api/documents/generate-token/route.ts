import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/TokenService';
import { firestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { applicationId, email, loanTypeId } = body;

    if (!applicationId || !email || !loanTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, email, loanTypeId' },
        { status: 400 }
      );
    }

    const token = TokenService.generateUploadToken(applicationId, email);

    // Store token metadata in Firestore
    await firestore.collection('uploadTokens').doc(token).set({
      applicationId,
      email,
      loanTypeId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      used: false,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}