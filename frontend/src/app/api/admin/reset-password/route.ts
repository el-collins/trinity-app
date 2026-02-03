import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from '@/lib/services/EmailService';

// POST - Request password reset (sends email with reset link)
export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json();

    // If token and password are provided, this is a password reset submission
    if (token && password) {
      return handlePasswordReset(token, password);
    }

    // Otherwise, this is a reset request (send email)
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const usersSnapshot = await firestore
      .collection('adminUsers')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    // Always return success to prevent email enumeration attacks
    if (usersSnapshot.empty) {
      console.log('Password reset requested for non-existent email:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check if user is active
    if (userData.isActive === false) {
      console.log('Password reset requested for inactive user:', email);
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Store reset token hash in user document
    await userDoc.ref.update({
      resetTokenHash,
      resetTokenExpiry,
      updatedAt: new Date(),
    });

    // Send password reset email
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}`;

    const emailSent = await emailService.sendPasswordResetEmail(email, {
      name: userData.name || 'Admin',
      resetUrl,
    });

    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
      // Still return success to prevent enumeration
    } else {
      console.log('Password reset email sent to:', email);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// GET - Verify reset token is valid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token
    const usersSnapshot = await firestore
      .collection('adminUsers')
      .where('resetTokenHash', '==', tokenHash)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check expiry
    const expiry = userData.resetTokenExpiry?.toDate?.() || userData.resetTokenExpiry;
    if (!expiry || new Date(expiry) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: userData.email,
      name: userData.name,
    });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 });
  }
}

// Handle password reset with token
async function handlePasswordReset(token: string, password: string) {
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    );
  }

  // Hash the token to compare with stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with this reset token
  const usersSnapshot = await firestore
    .collection('adminUsers')
    .where('resetTokenHash', '==', tokenHash)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link. Please request a new one.' },
      { status: 400 }
    );
  }

  const userDoc = usersSnapshot.docs[0];
  const userData = userDoc.data();

  // Check expiry
  const expiry = userData.resetTokenExpiry?.toDate?.() || userData.resetTokenExpiry;
  if (!expiry || new Date(expiry) < new Date()) {
    return NextResponse.json(
      { error: 'This reset link has expired. Please request a new one.' },
      { status: 400 }
    );
  }

  // Hash the new password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Update user: set new password, clear reset token
  await userDoc.ref.update({
    passwordHash,
    resetTokenHash: null,
    resetTokenExpiry: null,
    updatedAt: new Date(),
  });

  console.log('Password reset successful for user:', userData.email);

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
  });
}
