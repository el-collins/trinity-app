import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/TokenService';
import { firestore } from '@/lib/firebase/admin';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }
    // Validate JWT
    const decoded = TokenService.validateToken(token);
    if (!decoded) {
      return NextResponse.json({ valid: false, error: 'Invalid token' });
    }
    // Check Firestore
    const tokenDoc = await firestore.collection('uploadTokens').doc(token).get();
    if (!tokenDoc.exists) {
      return NextResponse.json({ valid: false, error: 'Token not found' });
    }
    const tokenData = tokenDoc.data()!;
    if (tokenData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ valid: false, error: 'Token expired' });
    }
    return NextResponse.json({
      valid: true,
      applicationId: decoded.applicationId,
      email: decoded.email,
      loanTypeId: tokenData.loanTypeId,
    });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}