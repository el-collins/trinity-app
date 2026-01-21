import { NextRequest, NextResponse } from 'next/server';
import { generateFormSchema } from '@/lib/validation/schemaGenerator';
import { neo4jConfigService } from '@/lib/services/Neo4jConfigService';
import { emailService } from '@/lib/services/EmailService';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanTypeId, responses, submittedAt } = body;

    if (!loanTypeId || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields: loanTypeId, responses' },
        { status: 400 }
      );
    }

    // Fetch form structure for validation
    const structure = await neo4jConfigService.getLoanTypeConfig(loanTypeId);
    
    if (!structure) {
      return NextResponse.json(
        { error: 'Invalid loan type' },
        { status: 400 }
      );
    }

    // Server-side validation with Zod
    try {
      const loanTypeDefinition = {
        id: structure.loanType.id,
        name: structure.loanType.name,
        tier: structure.loanType.tier,
        sections: structure.sections,
      };
      
      const schema = generateFormSchema(loanTypeDefinition);
      schema.parse(responses);
    } catch (validationError: any) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationError.issues || validationError.message 
        },
        { status: 400 }
      );
    }

    // Check for existing applications from same email to preserve history
    const applicantEmail = responses['business_email'] || responses['email'] || responses['contact_email'];
    let previousApplications: { id: string; submittedAt: string }[] = [];
    let applicationVersion = 1;

    if (applicantEmail) {
      try {
        // Query for previous applications with same email
        const previousAppsQuery = query(
          collection(db, 'applications'),
          where('applicantEmail', '==', applicantEmail)
        );
        const previousAppsSnapshot = await getDocs(previousAppsQuery);

        if (!previousAppsSnapshot.empty) {
          previousApplications = previousAppsSnapshot.docs.map(doc => ({
            id: doc.id,
            submittedAt: doc.data().submittedAt,
          }));
          applicationVersion = previousApplications.length + 1;
          console.log(`Found ${previousApplications.length} previous application(s) for ${applicantEmail}`);
        }
      } catch (queryError) {
        console.error('Error querying previous applications:', queryError);
        // Continue with new application even if query fails
      }
    }

    // Create application object with version tracking
    const application = {
      loanTypeId,
      responses,
      status: 'submitted',
      submittedAt: submittedAt || new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Data versioning fields
      applicantEmail: applicantEmail || null,
      version: applicationVersion,
      previousApplicationIds: previousApplications.map(app => app.id),
      // Preserve initial interaction data
      initialInteraction: {
        firstContactDate: previousApplications.length > 0
          ? previousApplications[0].submittedAt
          : (submittedAt || new Date().toISOString()),
        totalApplications: applicationVersion,
        loanTypesApplied: [loanTypeId],
      },
    };

    // Save to Firestore (creates new document, doesn't override)
    const docRef = await addDoc(collection(db, 'applications'), application);
    const applicationId = docRef.id;

    console.log('Application submitted to Firestore:', applicationId);

    // Send confirmation email to applicant
    try {
      const applicantName = `${responses['first_name'] || responses['contact_first_name'] || ''} ${responses['last_name'] || responses['contact_last_name'] || ''}`.trim();
      const applicantPhone = responses['business_phone'] || responses['phone'] || responses['mobile_phone'];

      if (applicantEmail) {
        // Send confirmation email to applicant
        await emailService.sendApplicationConfirmation(applicantEmail, {
          applicationId,
          loanType: structure.loanType.name,
          applicantName: applicantName || 'Applicant',
          submittedAt: application.submittedAt,
        });

        // Send notification email to admin
        await emailService.sendAdminNotification({
          applicationId,
          loanType: structure.loanType.name,
          applicantName: applicantName || 'Unknown',
          applicantEmail,
          applicantPhone,
          submittedAt: application.submittedAt,
        });

        console.log('Confirmation emails sent successfully');
      } else {
        console.warn('No email address found for applicant. Skipping email notification.');
      }
    } catch (emailError) {
      // Log error but don't fail the application submission
      console.error('Failed to send confirmation email:', emailError);
      // Continue with successful response even if email fails
    }

    return NextResponse.json({
      success: true,
      applicationId,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve application by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    // Retrieve from Firestore
    const docRef = doc(db, 'applications', applicationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = {
      id: docSnap.id,
      ...docSnap.data(),
      // Convert Firestore timestamps to ISO strings
      createdAt: docSnap.data().createdAt?.toDate().toISOString(),
      updatedAt: docSnap.data().updatedAt?.toDate().toISOString(),
    };

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error retrieving application:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve application' },
      { status: 500 }
    );
  }
}
