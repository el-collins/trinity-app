import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import { neo4jConfigService } from '@/lib/services/Neo4jConfigService';

export async function GET(
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

    // Get loan type info for field labels
    let fieldLabels: Record<string, string> = {};
    try {
      const loanConfig = await neo4jConfigService.getLoanTypeConfig(data.loanTypeId);
      if (loanConfig) {
        // Build field ID to label mapping
        loanConfig.sections.forEach(section => {
          section.fields.forEach(field => {
            fieldLabels[field.id] = field.label;
          });
        });
      }
    } catch (error) {
      console.error('Error fetching loan config for labels:', error);
    }

    // Get associated documents
    let documents: any[] = [];
    try {
      const docsQuery = await firestore
        .collection('applicationDocuments')
        .where('applicationId', '==', id)
        .get();

      documents = docsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() || doc.data().uploadedAt,
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
    }

    const application = {
      id: docSnap.id,
      loanTypeId: data.loanTypeId,
      status: data.status || 'submitted',
      submittedAt: data.submittedAt,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      applicantEmail: data.applicantEmail,
      version: data.version || 1,
      previousApplicationIds: data.previousApplicationIds || [],
      initialInteraction: data.initialInteraction,
      responses: data.responses || {},
      fieldLabels,
      documents,
    };

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const docRef = firestore.collection('applications').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status) {
      updates.status = status;
    }

    if (notes !== undefined) {
      updates.adminNotes = notes;
    }

    await docRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
