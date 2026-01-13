import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/EmailService';

/**
 * Test Email Configuration Endpoint
 *
 * Usage: GET /api/email/test?to=recipient@example.com
 *
 * This endpoint allows you to test your email configuration
 * by sending a test email to a specified recipient.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const recipientEmail = searchParams.get('to');

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Missing "to" query parameter. Usage: /api/email/test?to=recipient@example.com' },
        { status: 400 }
      );
    }

    // Verify email service connection
    const isConnected = await emailService.verifyConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          error: 'Email service connection failed',
          message: 'Please check your SMTP configuration in .env file'
        },
        { status: 500 }
      );
    }

    // Send test email
    const testData = {
      applicationId: 'TEST-' + Date.now(),
      loanType: 'Test Loan Application',
      applicantName: 'Test User',
      submittedAt: new Date().toISOString(),
    };

    const emailSent = await emailService.sendApplicationConfirmation(
      recipientEmail,
      testData
    );

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${recipientEmail}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to send test email',
          message: 'Check server logs for details'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      {
        error: 'Email test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
