import { NextRequest, NextResponse } from 'next/server';

/**
 * GHL Contact Sync API
 * 
 * Sends contact data to GoHighLevel when contact section is completed
 * This creates/updates the contact early in the application process
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      applicationId,
      loanType 
    } = body;

    // Validate required fields
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Either email or phone is required' },
        { status: 400 }
      );
    }

    const ghlWebhookUrl = process.env.NEXT_PUBLIC_GHL_WEBHOOK_URL;
    
    if (!ghlWebhookUrl) {
      console.warn('GHL webhook URL not configured');
      return NextResponse.json(
        { success: false, message: 'GHL webhook not configured' },
        { status: 200 }
      );
    }

    // Send to GHL
    const response = await fetch(ghlWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Event info
        event: 'contact_captured',
        applicationId,
        loanType,
        capturedAt: new Date().toISOString(),
        
        // Contact data
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
        
        // Tags and source
        tags: ['Application In Progress', loanType],
        source: 'Trinity Finance SmartForm',
        customFields: {
          application_id: applicationId,
          application_status: 'In Progress',
          loan_type: loanType,
        },
      }),
    });

    if (!response.ok) {
      console.error('GHL sync failed:', await response.text());
      return NextResponse.json(
        { success: false, message: 'GHL sync failed' },
        { status: 200 } // Don't fail the form, just log
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Contact synced to GHL',
      ghlContactId: result.contactId,
    });

  } catch (error) {
    console.error('GHL contact sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
