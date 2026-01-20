import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/EmailService';
export async function POST(request: NextRequest) {
  try {
    const { email, firstName, loanType, uploadLink, requiredDocuments } = await request.json();
    if (!email || !firstName || !uploadLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    await emailService.sendDocumentRequestEmail({
      to: email,
      firstName,
      loanType,
      uploadLink,
      requiredDocuments,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending document request email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}