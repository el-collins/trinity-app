import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import crypto from 'crypto';
import { emailService } from '@/lib/services/EmailService';

// POST - Resend invite email to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user
    const userDoc = await firestore.collection('adminUsers').doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data()!;

    // Check if user has already set their password (has logged in)
    if (userData.lastLogin) {
      return NextResponse.json(
        { error: 'User has already activated their account' },
        { status: 400 }
      );
    }

    // Generate a new setup token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');
    const setupTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Update user with new token
    await userDoc.ref.update({
      setupTokenHash,
      setupTokenExpiry,
      updatedAt: new Date(),
    });

    // Build the setup URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const setupUrl = `${baseUrl}/admin/setup-password?token=${setupToken}`;

    // Send invite email
    const emailSent = await emailService.sendAdminInvite(userData.email, {
      name: userData.name,
      setupUrl,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send invite email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invite email sent successfully',
    });
  } catch (error) {
    console.error('Error resending invite:', error);
    return NextResponse.json(
      { error: 'Failed to resend invite' },
      { status: 500 }
    );
  }
}
