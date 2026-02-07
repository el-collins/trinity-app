import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/EmailService';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, loanType, loanTypeId, uploadLink, requiredDocuments } = await request.json();

    if (!email || !firstName || !uploadLink) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, and uploadLink are required' },
        { status: 400 }
      );
    }

    // loanTypeId is required for loan-specific email templates
    // Falls back to 'general' if not provided for backwards compatibility
    const effectiveLoanTypeId = loanTypeId || 'general';

    await emailService.sendDocumentRequestEmail({
      to: email,
      firstName,
      loanType: loanType || 'Business Loan',
      loanTypeId: effectiveLoanTypeId,
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