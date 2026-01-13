import { NextRequest, NextResponse } from 'next/server';
import { ghlService } from '@/lib/services/GHLService';
import { config } from '@/lib/config';

/**
 * GHL Application Submitted API
 * 
 * Updates contact in GHL when application is fully submitted
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone,
      dateOfBirth,
      applicationId,
      loanType,
      contactSource,
      submittedAt
    } = body;

    // Send to GHL
    const contactId = await ghlService.createOrUpdateContact({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      tags: ['Application Submitted', loanType],
      source: contactSource || 'Trinity Finance SmartForm',
      customFields: [
        {
            id: config.goHighLevel.customFields.applicationId,
            key: 'application_id', 
            field_value: applicationId
        },
        {
            id: config.goHighLevel.customFields.applicationStatus,
            key: 'application_status',
            field_value: 'Submitted'
        },
        {
            id: config.goHighLevel.customFields.loanType,
            key: 'loan_type', 
            field_value: loanType
        },
        {
            id: config.goHighLevel.customFields.submissionDate,
            key: 'submission_date',
            field_value: new Date().toISOString().split('T')[0]
        }
      ]
    });

    if (!contactId) {
      console.error('GHL sync failed: No contact ID returned');
      return NextResponse.json(
        { success: false, message: 'GHL sync failed' },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Application submission synced to GHL',
      ghlContactId: contactId,
    });

  } catch (error) {
    console.error('GHL application sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
