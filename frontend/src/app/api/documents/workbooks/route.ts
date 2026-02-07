import { NextRequest, NextResponse } from 'next/server';

/**
 * Workbook template configuration for each loan type
 * Synced with EmailService.ts LOAN_TYPE_EMAIL_CONFIG
 */
interface WorkbookTemplate {
  name: string;
  url: string;
  description: string;
}

interface LoanTypeWorkbookConfig {
  displayName: string;
  workbooks: WorkbookTemplate[];
}

const LOAN_TYPE_WORKBOOKS: Record<string, LoanTypeWorkbookConfig> = {
  equipment_finance: {
    displayName: 'Equipment Finance',
    workbooks: [
      {
        name: 'Equipment Finance Workbook',
        url: 'https://docs.google.com/spreadsheets/d/1nF_E7Fw67oZEDjTngK7yU2G3FQoSE0-09G1r4vu7_Y4/copy',
        description: 'Details about the equipment you are financing',
      },
      {
        name: 'Debt Schedule Workbook',
        url: 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
        description: 'Current business debts and obligations',
      },
    ],
  },
  sba: {
    displayName: 'SBA Loan',
    workbooks: [
      {
        name: 'Debt Schedule Workbook',
        url: 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
        description: 'Current business debts and obligations',
      },
    ],
  },
  line_of_credit: {
    displayName: 'Line of Credit',
    workbooks: [
      {
        name: 'Debt Schedule Workbook',
        url: 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
        description: 'Current business debts and obligations',
      },
    ],
  },
  mca: {
    displayName: 'Merchant Cash Advance',
    workbooks: [
      {
        name: 'Debt Schedule Workbook',
        url: 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
        description: 'Current business debts and obligations',
      },
    ],
  },
  invoice_financing: {
    displayName: 'Invoice Financing',
    workbooks: [
      {
        name: 'Debt Schedule Workbook',
        url: 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
        description: 'Current business debts and obligations',
      },
      {
        name: 'Accounts Receivable Workbook',
        url: 'https://docs.google.com/spreadsheets/d/1pRiAcjQlTJns3-VTtZ-6Dm19itB_R8OVfZY4aiCR19k/copy',
        description: 'Outstanding invoices and accounts receivable aging',
      },
    ],
  },
  invoice_factoring: {
    displayName: 'Invoice Factoring',
    workbooks: [
      {
        name: 'Debt Schedule Workbook',
        url: 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
        description: 'Current business debts and obligations',
      },
      {
        name: 'Accounts Receivable Workbook',
        url: 'https://docs.google.com/spreadsheets/d/1pRiAcjQlTJns3-VTtZ-6Dm19itB_R8OVfZY4aiCR19k/copy',
        description: 'Outstanding invoices and accounts receivable aging',
      },
    ],
  },
  general: {
    displayName: 'Business Loan',
    workbooks: [
      {
        name: 'Debt Schedule Workbook',
        url: 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
        description: 'Current business debts and obligations',
      },
    ],
  },
};

/**
 * GET /api/documents/workbooks?loanTypeId=equipment_finance
 * Returns workbook templates for the specified loan type
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loanTypeId = searchParams.get('loanTypeId');

    if (!loanTypeId) {
      return NextResponse.json(
        { error: 'loanTypeId is required' },
        { status: 400 }
      );
    }

    // Normalize loan type ID
    const normalizedId = loanTypeId.toLowerCase().replace(/[\s-]+/g, '_');
    const config = LOAN_TYPE_WORKBOOKS[normalizedId] || LOAN_TYPE_WORKBOOKS['general'];

    return NextResponse.json({
      loanTypeId: normalizedId,
      displayName: config.displayName,
      workbooks: config.workbooks,
    });
  } catch (error) {
    console.error('Error fetching workbook templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workbook templates' },
      { status: 500 }
    );
  }
}
