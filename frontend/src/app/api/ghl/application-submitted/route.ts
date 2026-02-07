import { NextRequest, NextResponse } from 'next/server';
import { ghlService } from '@/lib/services/GHLService';
import { config } from '@/lib/config';
import { firestore } from '@/lib/firebase/admin';
import { TokenService } from '@/lib/services/TokenService';

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
      website,
      city,
      state,
      postalCode,
      applicationId,
      loanTypeId: loanType,
      contactSource,
      submittedAt,
      applicationUrl,
      // GHL Affiliate tracking
      affiliateId,
    } = body;

    // console.log('Received submission payload:', JSON.stringify(body, null, 2));

    // Validate required contact info - don't create empty contacts in GHL
    if (!email && !phone) {
      console.warn('Missing email and phone in submission payload, skipping GHL sync');
      return NextResponse.json(
        { success: false, message: 'Email or phone required for GHL sync' },
        { status: 400 }
      );
    }

    if (!firstName?.trim()) {
      console.warn('Missing first name in submission payload, skipping GHL sync');
      return NextResponse.json(
        { success: false, message: 'First name required for GHL sync' },
        { status: 400 }
      );
    }

    // Generate resume token and link for the submitted application
    let resumeLink = applicationUrl;
    if (!resumeLink && applicationId && email && loanType) {
      try {
        // Generate secure resume token
        const resumeToken = TokenService.generateUploadToken(applicationId, email);

        // Store token in resumeTokens collection
        await firestore.collection('resumeTokens').doc(resumeToken).set({
          applicationId,
          email,
          loanTypeId: loanType,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for submitted apps
          used: false,
        });

        resumeLink = `${config.api.baseUrl}/apply/${loanType}?resume=${resumeToken}`;
      } catch (tokenError) {
        console.error('Failed to generate resume token:', tokenError);
        // Fallback to simple URL without resume capability
        resumeLink = `${config.api.baseUrl}/apply/${loanType}`;
      }
    }

    // Build custom fields array with referral tracking
    const customFields = [
      {
        id: config.goHighLevel.customFields.applicationId,
        key: 'application_id',
        field_value: applicationId,
      },
      {
        id: config.goHighLevel.customFields.applicationStatus,
        key: 'application_status',
        field_value: 'Submitted',
      },
      {
        id: config.goHighLevel.customFields.loanType,
        key: 'loan_type',
        field_value: loanType,
      },
      {
        id: config.goHighLevel.customFields.applicationUrl,
        key: 'application_url',
        field_value: resumeLink,
      },
      {
        id: config.goHighLevel.customFields.submissionDate,
        key: 'submission_date',
        field_value: new Date().toISOString().split('T')[0],
      },
    ];

    // GHL Affiliate Manager ID for native affiliate tracking
    if (affiliateId && config.goHighLevel.customFields.affiliateId) {
      customFields.push({
        id: config.goHighLevel.customFields.affiliateId,
        key: 'am_id',
        field_value: affiliateId,
      });
      console.log('[GHL] Syncing affiliate tracking: am_id =', affiliateId);
    }

    // Send to GHL
    const contactId = await ghlService.createOrUpdateContact({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      website,
      city,
      state,
      postalCode,
      tags: [
        'Application Submitted',
        loanType,
        ...(affiliateId ? ['Affiliate Lead'] : []),
      ],
      source: contactSource || 'Trinity Finance SmartForm',
      customFields,
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
