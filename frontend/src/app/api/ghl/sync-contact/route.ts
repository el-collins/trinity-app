import { NextRequest, NextResponse } from 'next/server';
import { ghlService } from '@/lib/services/GHLService';

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

    // Send to GHL
    const contactId = await ghlService.createOrUpdateContact({
      firstName,
      lastName,
      email,
      phone,
      tags: ['Application In Progress', loanType],
      source: 'Trinity Finance SmartForm',
      customFields: [
        {
            id: 'application_id_field_id_placeholder', // TODO: user needs to provide actual field IDs if mapped
            key: 'application_id', 
            field_value: applicationId
        },
        {
            id: 'application_status_field_id_placeholder', // TODO: user needs to provide actual field IDs if mapped
            key: 'application_status',
            field_value: 'In Progress'
        },
        {
            id: 'loan_type_field_id_placeholder', // TODO: user needs to provide actual field IDs if mapped
            key: 'loan_type', 
            field_value: loanType
        }
      ]
    });

    if (!contactId) {
      console.error('GHL sync failed: No contact ID returned');
      return NextResponse.json(
        { success: false, message: 'GHL sync failed' },
        { status: 200 } // Don't fail the form, just log
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contact synced to GHL',
      ghlContactId: contactId,
    });

  } catch (error) {
    console.error('GHL contact sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
