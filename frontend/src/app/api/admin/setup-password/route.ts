import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// GET - Verify token is valid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token (query by hash only to avoid needing composite index)
    const usersSnapshot = await firestore
      .collection('adminUsers')
      .where('setupTokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please request a new invite.' },
        { status: 400 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check expiry in code
    const expiry = userData.setupTokenExpiry?.toDate?.() || userData.setupTokenExpiry;
    if (!expiry || new Date(expiry) < new Date()) {
      return NextResponse.json(
        { error: 'This invite link has expired. Please request a new invite.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: userData.email,
      name: userData.name,
    });
  } catch (error) {
    console.error('Error verifying setup token:', error);
    return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 });
  }
}

// POST - Set password with token
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token (query by hash only to avoid needing composite index)
    const usersSnapshot = await firestore
      .collection('adminUsers')
      .where('setupTokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please request a new invite.' },
        { status: 400 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check expiry in code
    const expiry = userData.setupTokenExpiry?.toDate?.() || userData.setupTokenExpiry;
    if (!expiry || new Date(expiry) < new Date()) {
      return NextResponse.json(
        { error: 'This invite link has expired. Please request a new invite.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user: set password, clear token, mark as active
    await userDoc.ref.update({
      passwordHash,
      setupTokenHash: null,
      setupTokenExpiry: null,
      isActive: true,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
  }
}
