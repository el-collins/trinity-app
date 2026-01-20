import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }
    const appDoc = await firestore.collection('applications').doc(applicationId).get();
    if (!appDoc.exists) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    const documents = appDoc.data()?.documents || {};
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching application documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}