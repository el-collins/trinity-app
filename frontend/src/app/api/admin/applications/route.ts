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

    // Get all matching documents (we'll filter deleted ones client-side)
    const snapshot = await query.get();

    // Filter out deleted applications and map to response format
    const allApplications = snapshot.docs
      .filter(doc => !doc.data().deleted) // Filter deleted apps client-side
      .map(doc => {
      const data = doc.data();

      // Extract key information from responses for list view
      const responses = data.responses || {};
      const businessName = responses.business_name || responses.legal_business_name || 'N/A';
      const contactName = `${responses.first_name || responses.contact_first_name || ''} ${responses.last_name || responses.contact_last_name || ''}`.trim() || 'N/A';
      const email = data.applicantEmail || responses.business_email || responses.email || 'N/A';
      const phone = responses.business_phone || responses.phone || responses.mobile_phone || 'N/A';
      const requestedAmount = responses.requested_amount || responses.loan_amount || responses.desired_funding_amount || null;

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
    let filteredApplications = allApplications;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = allApplications.filter((app: any) =>
        app.businessName.toLowerCase().includes(searchLower) ||
        app.contactName.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination client-side
    const totalCount = filteredApplications.length;
    const offset = (page - 1) * limit;
    const paginatedApplications = filteredApplications.slice(offset, offset + limit);

    return NextResponse.json({
      applications: paginatedApplications,
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
