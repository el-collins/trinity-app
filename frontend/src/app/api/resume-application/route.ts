import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing resume token' },
        { status: 400 }
      );
    }

    // 1. Look up token in database
    const tokenDoc = await firestore.collection('resumeTokens').doc(token).get();

    if (!tokenDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired resume link' },
        { status: 404 }
      );
    }

    const tokenData = tokenDoc.data();

    // 2. Check if token is expired
    if (tokenData?.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
      return NextResponse.json(
        { error: 'Resume link has expired' },
        { status: 410 }
      );
    }

    // 3. Check if token was already used (optional - remove if you want reusable links)
    // if (tokenData?.used) {
    //   return NextResponse.json(
    //     { error: 'Resume link has already been used' },
    //     { status: 410 }
    //   );
    // }

    // 4. Load application data - check both drafts and submitted applications
    const applicationId = tokenData?.applicationId;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 400 }
      );
    }

    // First try applicationDrafts (for Save & Exit feature)
    let draftDoc = await firestore.collection('applicationDrafts').doc(applicationId).get();

    if (draftDoc.exists) {
      const draftData = draftDoc.data();
      return NextResponse.json({
        loanTypeId: draftData?.loanTypeId,
        responses: draftData?.responses || {},
        currentSectionIndex: draftData?.currentSectionIndex || 0,
        completedSections: draftData?.completedSections || [],
      });
    }

    // If not in drafts, try submitted applications collection
    const appDoc = await firestore.collection('applications').doc(applicationId).get();

    if (appDoc.exists) {
      const appData = appDoc.data();
      return NextResponse.json({
        applicationId, // Include applicationId for tracking
        loanTypeId: appData?.loanTypeId,
        responses: appData?.responses || {},
        currentSectionIndex: 0, // Start at beginning for submitted apps
        completedSections: [], // Reset completion status
      });
    }

    // Neither draft nor submitted application found
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error resuming application:', error);
    return NextResponse.json(
      { error: 'Failed to resume application' },
      { status: 500 }
    );
  }
}
