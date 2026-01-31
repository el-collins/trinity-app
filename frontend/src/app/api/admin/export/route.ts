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

    // Filter out deleted applications and drafts (same as list API)
    const filteredDocs = snapshot.docs.filter(doc => {
      const data = doc.data();
      // Filter out deleted applications
      if (data.deleted) return false;
      // Filter out drafts and in-progress - only export submitted applications
      if (!data.status || data.status === 'draft' || data.status === 'in_progress') return false;
      return true;
    });

    // Collect all unique response field keys from all applications
    const allResponseKeys = new Set<string>();
    // Collect all unique document keys from all applications
    const allDocumentKeys = new Set<string>();

    filteredDocs.forEach(doc => {
      const data = doc.data();
      const responses = data.responses || {};
      const documents = data.documents || {};

      // Collect response keys
      Object.keys(responses).forEach(key => {
        // Skip signature images (base64 data)
        const value = responses[key];
        if (typeof value === 'string' && value.startsWith('data:image')) return;
        allResponseKeys.add(key);
      });

      // Collect document keys
      Object.keys(documents).forEach(key => {
        allDocumentKeys.add(key);
      });
    });

    // Convert field keys to readable labels
    const formatFieldLabel = (key: string): string => {
      return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Sort response keys alphabetically for consistent column order
    const sortedResponseKeys = Array.from(allResponseKeys).sort();
    // Sort document keys alphabetically
    const sortedDocumentKeys = Array.from(allDocumentKeys).sort();

    // Map applications with all fields
    const applications = filteredDocs.map(doc => {
      const data = doc.data();
      const responses = data.responses || {};
      const documents = data.documents || {};

      // Start with fixed fields
      const row: Record<string, any> = {
        'Application ID': doc.id,
        'Loan Type': LOAN_TYPE_LABELS[data.loanTypeId] || data.loanTypeId || '',
        'Status': (data.status || 'submitted').replace('_', ' ').toUpperCase(),
        'Submitted At': data.submittedAt || '',
        'Applicant Email': data.applicantEmail || '',
        'Version': data.version || 1,
      };

      // Add all response fields dynamically
      sortedResponseKeys.forEach(key => {
        const label = formatFieldLabel(key);
        let value = responses[key];

        // Format boolean values
        if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No';
        }

        row[label] = value ?? '';
      });

      // Add all document URLs dynamically
      sortedDocumentKeys.forEach(key => {
        const label = `Doc: ${formatFieldLabel(key)}`;
        const docData = documents[key];
        row[label] = docData?.url || '';
      });

      return row;
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

      // Dynamically generate columns from the first application's keys
      const allKeys = filteredApplications.length > 0
        ? Object.keys(filteredApplications[0])
        : ['Application ID', 'Loan Type', 'Status', 'Submitted At', 'Applicant Email', 'Version'];

      const columns = allKeys.map(key => ({
        header: key,
        key: key,
        width: key.length < 15 ? 18 : Math.min(key.length + 5, 35),
      }));

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

        // Format currency columns (any column with amount, revenue, funding, etc.)
        row.eachCell((cell, colNumber) => {
          if (cell.value && typeof cell.value === 'number') {
            const header = allKeys[colNumber - 1]?.toLowerCase() || '';
            if (header.includes('amount') || header.includes('revenue') || header.includes('funding') || header.includes('salary') || header.includes('income')) {
              cell.numFmt = '$#,##0';
            }
          }
        });
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

      // Prepare data for Google Sheets - dynamically from application keys
      const headers = filteredApplications.length > 0
        ? Object.keys(filteredApplications[0])
        : ['Application ID', 'Loan Type', 'Status', 'Submitted At', 'Applicant Email', 'Version'];

      const rows = filteredApplications.map(app =>
        headers.map(header => app[header as keyof typeof app] ?? '')
      );

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
