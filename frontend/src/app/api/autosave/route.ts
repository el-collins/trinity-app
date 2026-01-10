import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, loanTypeId, responses, currentSectionIndex } = await request.json();

    if (!applicationId || !loanTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save/update application in Firestore
    const docRef = doc(db, 'applications', applicationId);
    
    await setDoc(docRef, {
      loanTypeId,
      responses,
      currentSectionIndex,
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    }, { merge: true }); // Merge to preserve other fields

    return NextResponse.json({ 
      success: true,
      message: 'Progress saved'
    });
  } catch (error) {
    console.error('Auto-save error:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
