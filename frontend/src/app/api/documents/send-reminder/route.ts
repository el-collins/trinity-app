import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/EmailService';
import { firestore } from '@/lib/firebase/admin';

/**
 * POST /api/documents/send-reminder
 * Sends a reminder email with the document upload link
 */
export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: token, email' },
        { status: 400 }
      );
    }

    // Verify token exists and is valid
    const tokenDoc = await firestore.collection('uploadTokens').doc(token).get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const tokenData = tokenDoc.data();

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token data not found' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const expiresAt = tokenData.expiresAt?.toDate?.() || new Date(tokenData.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { error: 'Token has expired. Please request a new upload link.' },
        { status: 400 }
      );
    }

    // Get the upload URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.financetrinity.com';
    const uploadLink = `${baseUrl}/documents/upload/${token}`;

    // Get applicant first name from the application
    let firstName = 'Applicant';
    try {
      const appDoc = await firestore.collection('applications').doc(tokenData.applicationId).get();
      if (appDoc.exists) {
        const appData = appDoc.data();
        firstName = appData?.responses?.contact_first_name ||
                   appData?.responses?.first_name ||
                   'Applicant';
      }
    } catch (e) {
      console.warn('Could not fetch applicant name:', e);
    }

    // Send reminder email
    await emailService.sendDocumentUploadReminder({
      to: email,
      firstName,
      uploadLink,
      loanTypeId: tokenData.loanTypeId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending document reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder email' },
      { status: 500 }
    );
  }
}
