import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { encodeFormState } from '@/lib/utils/urlState';

/**
 * GHL Webhook Handler
 * 
 * Receives contact data from GoHighLevel when a new contact is created
 * Creates a new application in Firestore and returns a shareable URL with token
 * 
 * Expected payload from GHL:
 * {
 *   contactId: string,
 *   email: string,
 *   phone: string,
 *   firstName: string,
 *   lastName: string,
 *   loanType: string (optional, defaults to 'mca')
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    const {
      contactId,
      email,
      phone,
      firstName,
      lastName,
      loanType = 'mca', // Default to MCA if not specified
    } = payload;

    // Validate required fields
    if (!contactId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: contactId, email' },
        { status: 400 }
      );
    }

    // Pre-populate responses with contact info
    const responses = {
      contact_email: email,
      contact_phone: phone || '',
      contact_first_name: firstName || '',
      contact_last_name: lastName || '',
      first_name: firstName || '',
      last_name: lastName || '',
      email: email,
      phone: phone || '',
    };

    // Create application in Firestore (for backup/tracking)
    const docRef = await addDoc(collection(db, 'applications'), {
      contactId,
      email,
      phone: phone || '',
      name: `${firstName || ''} ${lastName || ''}`.trim(),
      loanTypeId: loanType,
      responses,
      status: 'in_progress',
      currentSectionIndex: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const applicationId = docRef.id;

    // Generate URL token with pre-populated data
    const token = encodeFormState({
      loanTypeId: loanType,
      responses,
      currentSectionIndex: 0,
      completedSections: [],
    });

    // Generate shareable URL with token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareableUrl = `${baseUrl}/apply/${loanType}?resume=${token}`;

    console.log('Application created from GHL:', {
      applicationId,
      contactId,
      email,
      shareableUrl,
    });

    // Return URL to GHL (can be stored in custom field)
    return NextResponse.json({
      success: true,
      applicationId,
      applicationUrl: shareableUrl,
      message: 'Application created successfully',
    });
  } catch (error) {
    console.error('GHL webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
