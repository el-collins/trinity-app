import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import ExcelJS from 'exceljs';
import { googleSheetsService } from '@/lib/services/GoogleSheetsService';

const LOAN_TYPE_LABELS: Record<string, string> = {
  mca: 'Merchant Cash Advance',
  line_of_credit: 'Line of Credit',
  sba: 'SBA Loan',
  equipment_finance: 'Equipment Finance',
  invoice_factoring: 'Invoice Factoring',
  invoice_financing: 'Invoice Financing',
  general: 'General Loan',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'excel';
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

    // Filter out deleted applications (same as list API)
    const applications = snapshot.docs
      .filter(doc => !doc.data().deleted)
      .map(doc => {
      const data = doc.data();
      const responses = data.responses || {};

      return {
        'Application ID': doc.id,
        'Loan Type': LOAN_TYPE_LABELS[data.loanTypeId] || data.loanTypeId || '',
        'Status': (data.status || 'submitted').replace('_', ' ').toUpperCase(),
        'Submitted At': data.submittedAt || '',
        'Business Name': responses.business_name || responses.legal_business_name || '',
        'Contact First Name': responses.first_name || responses.contact_first_name || '',
        'Contact Last Name': responses.last_name || responses.contact_last_name || '',
        'Email': data.applicantEmail || responses.business_email || responses.email || '',
        'Phone': responses.business_phone || responses.phone || responses.mobile_phone || '',
        'Requested Amount': responses.requested_amount || responses.loan_amount || responses.desired_funding_amount || '',
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

    if (format === 'excel' || format === 'xlsx') {
      // Generate Excel file using ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Trinity Finance CMS';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Applications', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }], // Freeze header row
      });

      // Define columns with headers and widths
      const columns = [
        { header: 'Application ID', key: 'Application ID', width: 25 },
        { header: 'Loan Type', key: 'Loan Type', width: 25 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Submitted At', key: 'Submitted At', width: 20 },
        { header: 'Business Name', key: 'Business Name', width: 30 },
        { header: 'Contact First Name', key: 'Contact First Name', width: 18 },
        { header: 'Contact Last Name', key: 'Contact Last Name', width: 18 },
        { header: 'Email', key: 'Email', width: 30 },
        { header: 'Phone', key: 'Phone', width: 18 },
        { header: 'Requested Amount', key: 'Requested Amount', width: 18 },
        { header: 'Business Address', key: 'Business Address', width: 35 },
        { header: 'City', key: 'City', width: 15 },
        { header: 'State', key: 'State', width: 10 },
        { header: 'Zip Code', key: 'Zip Code', width: 12 },
        { header: 'Years in Business', key: 'Years in Business', width: 18 },
        { header: 'Annual Revenue', key: 'Annual Revenue', width: 18 },
        { header: 'FICO Score', key: 'FICO Score', width: 12 },
        { header: 'Use of Funds', key: 'Use of Funds', width: 30 },
        { header: 'Version', key: 'Version', width: 10 },
      ];

      worksheet.columns = columns;

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' }, // Blue-600
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      // Add data rows
      filteredApplications.forEach((app, index) => {
        const row = worksheet.addRow(app);

        // Alternate row colors for readability
        if (index % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F3F4F6' }, // Gray-100
          };
        }

        // Format currency columns
        const amountCell = row.getCell('Requested Amount');
        if (amountCell.value && typeof amountCell.value === 'number') {
          amountCell.numFmt = '$#,##0';
        }

        const revenueCell = row.getCell('Annual Revenue');
        if (revenueCell.value && typeof revenueCell.value === 'number') {
          revenueCell.numFmt = '$#,##0';
        }
      });

      // Add borders to all cells
      worksheet.eachRow((row: ExcelJS.Row) => {
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'E5E7EB' } },
            left: { style: 'thin', color: { argb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
            right: { style: 'thin', color: { argb: 'E5E7EB' } },
          };
        });
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Trinity_Finance_Applications_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }

    if (format === 'googlesheets' || format === 'gsheets') {
      // Check if Google Sheets is configured
      if (!googleSheetsService.isConfigured()) {
        return NextResponse.json(
          {
            error: 'Google Sheets integration not configured',
            message: 'Please configure environment variables, and enable Google Sheets API in your Google Cloud project.',
          },
          { status: 503 }
        );
      }

      // Prepare data for Google Sheets
      const headers = [
        'Application ID',
        'Loan Type',
        'Status',
        'Submitted At',
        'Business Name',
        'Contact First Name',
        'Contact Last Name',
        'Email',
        'Phone',
        'Requested Amount',
        'Business Address',
        'City',
        'State',
        'Zip Code',
        'Years in Business',
        'Annual Revenue',
        'FICO Score',
        'Use of Funds',
        'Version',
      ];

      const rows = filteredApplications.map(app => [
        app['Application ID'],
        app['Loan Type'],
        app['Status'],
        app['Submitted At'],
        app['Business Name'],
        app['Contact First Name'],
        app['Contact Last Name'],
        app['Email'],
        app['Phone'],
        app['Requested Amount'],
        app['Business Address'],
        app['City'],
        app['State'],
        app['Zip Code'],
        app['Years in Business'],
        app['Annual Revenue'],
        app['FICO Score'],
        app['Use of Funds'],
        app['Version'],
      ]);

      try {
        const result = await googleSheetsService.createSpreadsheet({
          title: `Trinity Finance Applications - ${new Date().toISOString().split('T')[0]}`,
          headers,
          rows,
        });

        return NextResponse.json({
          success: true,
          spreadsheetId: result.spreadsheetId,
          spreadsheetUrl: result.spreadsheetUrl,
          totalRecords: filteredApplications.length,
        });
      } catch (sheetsError: any) {
        console.error('Google Sheets export error:', sheetsError);
        console.error('Error details:', JSON.stringify({
          code: sheetsError?.code,
          status: sheetsError?.status,
          message: sheetsError?.message,
          errors: sheetsError?.errors,
          response: sheetsError?.response?.data,
          cause: sheetsError?.cause,
        }, null, 2));
        return NextResponse.json(
          {
            error: 'Failed to create Google Sheet',
            message: sheetsError instanceof Error ? sheetsError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    if (format === 'csv') {
      // Generate CSV (keeping for backwards compatibility)
      const headers = Object.keys(filteredApplications[0] || {});
      const csvRows = [
        headers.join(','),
        ...filteredApplications.map(app =>
          headers.map(header => {
            const value = String(app[header as keyof typeof app] || '');
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
