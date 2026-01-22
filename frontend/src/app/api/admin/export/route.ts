import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status');
    const loanType = searchParams.get('loanType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query: FirebaseFirestore.Query = firestore.collection('applications');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (loanType) {
      query = query.where('loanTypeId', '==', loanType);
    }

    // Order by submission date
    query = query.orderBy('submittedAt', 'desc');

    const snapshot = await query.get();

    const applications = snapshot.docs.map(doc => {
      const data = doc.data();
      const responses = data.responses || {};

      return {
        'Application ID': doc.id,
        'Loan Type': data.loanTypeId || '',
        'Status': data.status || 'submitted',
        'Submitted At': data.submittedAt || '',
        'Business Name': responses.business_name || responses.company_name || '',
        'Contact First Name': responses.first_name || responses.contact_first_name || '',
        'Contact Last Name': responses.last_name || responses.contact_last_name || '',
        'Email': data.applicantEmail || responses.business_email || responses.email || '',
        'Phone': responses.business_phone || responses.phone || responses.mobile_phone || '',
        'Requested Amount': responses.requested_amount || responses.loan_amount || responses.funding_amount || '',
        'Business Address': responses.business_address || '',
        'City': responses.city || '',
        'State': responses.state || '',
        'Zip Code': responses.zip_code || '',
        'Years in Business': responses.years_in_business || '',
        'Annual Revenue': responses.annual_revenue || responses.gross_annual_revenue || '',
        'FICO Score': responses.fico_score || responses.credit_score || '',
        'Use of Funds': responses.use_of_funds || responses.funding_purpose || '',
        'Version': data.version || 1,
      };
    });

    // Filter by date if provided
    let filteredApplications = applications;
    if (startDate || endDate) {
      filteredApplications = applications.filter(app => {
        const submittedAt = new Date(app['Submitted At']);
        if (startDate && submittedAt < new Date(startDate)) return false;
        if (endDate && submittedAt > new Date(endDate)) return false;
        return true;
      });
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(filteredApplications[0] || {});
      const csvRows = [
        headers.join(','),
        ...filteredApplications.map(app =>
          headers.map(header => {
            const value = String(app[header as keyof typeof app] || '');
            // Escape quotes and wrap in quotes if contains comma or quote
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        ),
      ];

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="applications_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: return JSON
    return NextResponse.json({
      applications: filteredApplications,
      exportedAt: new Date().toISOString(),
      totalRecords: filteredApplications.length,
    });
  } catch (error) {
    console.error('Error exporting applications:', error);
    return NextResponse.json(
      { error: 'Failed to export applications' },
      { status: 500 }
    );
  }
}
