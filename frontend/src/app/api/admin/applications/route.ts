import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status');
    const loanType = searchParams.get('loanType');
    const search = searchParams.get('search');

    // Build query
    let query: FirebaseFirestore.Query = firestore.collection('applications');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (loanType) {
      query = query.where('loanTypeId', '==', loanType);
    }

    // Order by submission date (newest first)
    query = query.orderBy('submittedAt', 'desc');

    // Get total count for pagination (without limit)
    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();

    const applications = snapshot.docs.map(doc => {
      const data = doc.data();

      // Extract key information from responses for list view
      const responses = data.responses || {};
      const businessName = responses.business_name || responses.company_name || 'N/A';
      const contactName = `${responses.first_name || responses.contact_first_name || ''} ${responses.last_name || responses.contact_last_name || ''}`.trim() || 'N/A';
      const email = data.applicantEmail || responses.business_email || responses.email || 'N/A';
      const phone = responses.business_phone || responses.phone || responses.mobile_phone || 'N/A';
      const requestedAmount = responses.requested_amount || responses.loan_amount || responses.funding_amount || null;

      return {
        id: doc.id,
        loanTypeId: data.loanTypeId,
        status: data.status || 'submitted',
        submittedAt: data.submittedAt,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        version: data.version || 1,
        // Summary fields for list view
        businessName,
        contactName,
        email,
        phone,
        requestedAmount,
      };
    });

    // Apply client-side search filter if provided
    let filteredApplications = applications;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = applications.filter(app =>
        app.businessName.toLowerCase().includes(searchLower) ||
        app.contactName.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.id.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      applications: filteredApplications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
