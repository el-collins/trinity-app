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

    // Use server-side status filter to skip drafts/in-progress at the DB level.
    // A single-field where() does not require a composite index.
    const SUBMITTED_STATUSES = ['submitted', 'under_review', 'approved', 'declined', 'funded'];
    let baseQuery: FirebaseFirestore.Query = firestore
      .collection('applications')
      .where('status', 'in', SUBMITTED_STATUSES);

    // Only apply loan type filter server-side when no other filters combine with it
    // (avoids composite index requirement when status filter is already applied).
    // We will re-filter loanType in-memory below when status is also filtered.

    // Use .select() to fetch only lightweight top-level fields — skips the heavy
    // responses blob entirely for documents that have the denormalized summary fields.
    const snapshot = await baseQuery
      .select(
        'loanTypeId', 'status', 'submittedAt', 'createdAt', 'updatedAt', 'version',
        'deleted',
        // Denormalized summary fields (present on new applications)
        'businessName', 'contactName', 'contactEmail', 'contactPhone', 'requestedAmount',
        // Legacy fallback field
        'applicantEmail',
      )
      .get();

    // Filter and map to response format
    const allApplications = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        // Filter out deleted applications
        if (data.deleted) return false;
        // Apply status filter (UI-level, already filtered at DB for submitted statuses)
        if (status && data.status !== status) return false;
        // Apply loan type filter
        if (loanType && data.loanTypeId !== loanType) return false;
        return true;
      })
      .map(doc => {
        const data = doc.data();

        // Use denormalized summary fields when available (new applications).
        // Fall back gracefully for older documents that predate this optimization.
        const businessName = data.businessName || 'N/A';
        const contactName = data.contactName || 'N/A';
        const email = data.contactEmail || data.applicantEmail || 'N/A';
        const phone = data.contactPhone || 'N/A';
        const requestedAmount = data.requestedAmount || null;

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
      })
    // Sort by submission date (newest first)
    .sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
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
