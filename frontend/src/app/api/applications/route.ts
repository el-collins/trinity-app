import { NextRequest, NextResponse } from 'next/server';
import { generateFormSchema } from '@/lib/validation/schemaGenerator';
import { neo4jConfigService } from '@/lib/services/Neo4jConfigService';
import { emailService } from '@/lib/services/EmailService';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanTypeId, responses, submittedAt, referralData, applicationId } = body;

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

    const applicantEmail = responses['business_email'] || responses['email'] || responses['contact_email'];
    let finalApplicationId: string;
    let isUpdate = false;

    // Denormalized summary fields — stored at top level so the admin list
    // can use .select() and skip downloading the full responses blob.
    const summary = {
      businessName: responses['business_name'] || responses['legal_business_name'] || null,
      contactName: `${responses['first_name'] || responses['contact_first_name'] || ''} ${responses['last_name'] || responses['contact_last_name'] || ''}`.trim() || null,
      contactEmail: applicantEmail || null,
      contactPhone: responses['business_phone'] || responses['phone'] || responses['mobile_phone'] || null,
      requestedAmount: responses['requested_amount'] || responses['loan_amount'] || responses['desired_funding_amount'] || null,
    };

    // CHECK: If applicationId is provided, UPDATE existing application
    if (applicationId) {
      isUpdate = true;
      console.log('Updating existing application:', applicationId);

      // Verify application exists
      const existingDocRef = doc(db, 'applications', applicationId);
      const existingDocSnap = await getDoc(existingDocRef);

      if (!existingDocSnap.exists()) {
        return NextResponse.json(
          { error: 'Application not found for update' },
          { status: 404 }
        );
      }

      const existingData = existingDocSnap.data();

      // Update the existing application
      const updateData = {
        loanTypeId,
        responses,
        status: 'submitted', // Reset to submitted status
        submittedAt: submittedAt || new Date().toISOString(),
        updatedAt: serverTimestamp(),
        applicantEmail: applicantEmail || null,
        ...summary,
        // Preserve original metadata
        createdAt: existingData.createdAt,
        version: existingData.version || 1,
        previousApplicationIds: existingData.previousApplicationIds || [],
        initialInteraction: existingData.initialInteraction,
        // Update referral tracking if provided
        referralTracking: referralData ? {
          referralCode: referralData.referralCode || null,
          agentId: referralData.agentId || null,
          affiliateId: referralData.affiliateId || null,
          utmSource: referralData.utmSource || null,
          utmMedium: referralData.utmMedium || null,
          utmCampaign: referralData.utmCampaign || null,
          utmTerm: referralData.utmTerm || null,
          utmContent: referralData.utmContent || null,
          landingUrl: referralData.landingUrl || null,
          capturedAt: referralData.capturedAt || null,
        } : existingData.referralTracking || null,
        // Track that this was edited
        lastEditedAt: serverTimestamp(),
        editedBy: 'admin', // Flag that admin edited this
      };

      await updateDoc(existingDocRef, updateData);
      finalApplicationId = applicationId;

      console.log('Application updated successfully:', applicationId);
    } else {
      // CREATE new application
      console.log('Creating new application');

      // Check for existing applications from same email to preserve history
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
        ...summary,
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
        // Referral tracking data
        referralTracking: referralData ? {
          referralCode: referralData.referralCode || null,
          agentId: referralData.agentId || null,
          affiliateId: referralData.affiliateId || null,
          utmSource: referralData.utmSource || null,
          utmMedium: referralData.utmMedium || null,
          utmCampaign: referralData.utmCampaign || null,
          utmTerm: referralData.utmTerm || null,
          utmContent: referralData.utmContent || null,
          landingUrl: referralData.landingUrl || null,
          capturedAt: referralData.capturedAt || null,
        } : null,
      };

      // Save to Firestore (creates new document)
      const docRef = await addDoc(collection(db, 'applications'), application);
      finalApplicationId = docRef.id;

      console.log('Application created in Firestore:', finalApplicationId);
    }

    // Send confirmation email to applicant
    try {
      const applicantName = `${responses['first_name'] || responses['contact_first_name'] || ''} ${responses['last_name'] || responses['contact_last_name'] || ''}`.trim();
      const applicantPhone = responses['business_phone'] || responses['phone'] || responses['mobile_phone'];

      if (applicantEmail) {
        // Send confirmation email to applicant
        await emailService.sendApplicationConfirmation(applicantEmail, {
          applicationId: finalApplicationId,
          loanType: structure.loanType.name,
          applicantName: applicantName || 'Applicant',
          submittedAt: submittedAt || new Date().toISOString(),
        });

        // Send notification email to admin
        await emailService.sendAdminNotification({
          applicationId: finalApplicationId,
          loanType: structure.loanType.name,
          applicantName: applicantName || 'Unknown',
          applicantEmail,
          applicantPhone,
          submittedAt: submittedAt || new Date().toISOString(),
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
      applicationId: finalApplicationId,
      message: isUpdate ? 'Application updated successfully' : 'Application submitted successfully',
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

    const data = docSnap.data();

    // Fetch loan type config to get field labels
    let fieldLabels: Record<string, string> = {};
    let sections: any[] = [];
    try {
      const loanConfig = await neo4jConfigService.getLoanTypeConfig(data.loanTypeId);
      if (loanConfig) {
        sections = loanConfig.sections;
        // Build field ID to label mapping
        loanConfig.sections.forEach((section: any) => {
          section.fields.forEach((field: any) => {
            fieldLabels[field.id] = field.label;
          });
        });
      }
    } catch (error) {
      console.error('Error fetching loan config for labels:', error);
    }

    const application = {
      id: docSnap.id,
      ...data,
      // Convert Firestore timestamps to ISO strings
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
      // Add field labels and sections for display
      fieldLabels,
      sections,
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
