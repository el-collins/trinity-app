import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import { TokenService } from '@/lib/services/TokenService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get application from Firestore
    const docRef = firestore.collection('applications').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const data = docSnap.data()!;
    const { loanTypeId, applicantEmail } = data;

    if (!loanTypeId || !applicantEmail) {
      return NextResponse.json(
        { error: 'Application missing required fields' },
        { status: 400 }
      );
    }

    // Generate secure resume token
    const token = TokenService.generateUploadToken(id, applicantEmail);

    // Store token in resumeTokens collection
    await firestore.collection('resumeTokens').doc(token).set({
      applicationId: id,
      email: applicantEmail,
      loanTypeId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      used: false,
      createdBy: 'admin', // Track that this was admin-generated
    });

    // Build resume URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const resumeLink = `${baseUrl}/apply/${loanTypeId}?resume=${token}`;

    return NextResponse.json({
      success: true,
      resumeLink,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error generating resume link:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume link' },
      { status: 500 }
    );
  }
}
