import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/lib/services/TokenService';
import { storage, firestore } from '@/lib/firebase/admin';
import { ghlService } from '@/lib/services/GHLService';
import { emailService } from '@/lib/services/EmailService';
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const documentId = formData.get('documentId') as string;
    const file = formData.get('file') as File;
    if (!token || !documentId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Validate token
    const decoded = TokenService.validateToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const { applicationId } = decoded;
    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileName = `applications/${applicationId}/${documentId}/${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileUpload = bucket.file(fileName);
    await fileUpload.save(fileBuffer, {
      metadata: { contentType: file.type },
    });

    // Generate a signed URL (valid for 10 years) instead of making public
    const [signedUrl] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });
    const publicUrl = signedUrl;
    // Save to Firestore (create if doesn't exist)
    await firestore.collection('applications').doc(applicationId).set({
      documents: {
        [documentId]: {
          url: publicUrl,
          uploadedAt: new Date(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }
      }
    }, { merge: true });
    // Sync to GHL with document URL and "Documents Uploaded" tag
    const ghlFieldId = getGHLFieldId(documentId);
    const documentLabel = getDocumentLabel(documentId);
    console.log(`[Document Upload] Syncing to GHL - Document ID: ${documentId}, Field ID: ${ghlFieldId}, Email: ${decoded.email}`);

    try {
      // Build update payload with tags for document tracking
      const ghlPayload: {
        email: string;
        tags: string[];
        customFields?: { id: string; field_value: string }[];
      } = {
        email: decoded.email,
        tags: ['Documents Uploaded', `Doc: ${documentLabel}`],
      };

      // Add custom field if mapping exists
      if (ghlFieldId) {
        ghlPayload.customFields = [{ id: ghlFieldId, field_value: publicUrl }];
      }

      const contactId = await ghlService.createOrUpdateContact(ghlPayload);
      console.log(`[Document Upload] Successfully synced to GHL contact: ${contactId} with tags: ${ghlPayload.tags.join(', ')}`);
    } catch (ghlError: any) {
      console.error(`[Document Upload] GHL sync failed:`, ghlError.response?.data || ghlError.message);
      // Don't fail the upload if GHL sync fails - log and continue
    }

    // Send team notification about document upload
    try {
      await emailService.sendDocumentUploadNotification({
        applicationId,
        applicantEmail: decoded.email,
        documentName: documentLabel,
        documentUrl: publicUrl,
        uploadedAt: new Date().toISOString(),
      });
    } catch (notifyError) {
      console.error('[Document Upload] Team notification failed:', notifyError);
      // Don't fail the upload if notification fails
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
function getGHLFieldId(documentId: string): string | null {
  const fieldMap: Record<string, string> = {
    // Identity Documents
    drivers_license_front: process.env.GHL_FIELD_DRIVERS_LICENSE_FRONT!,
    drivers_license_back: process.env.GHL_FIELD_DRIVERS_LICENSE_BACK!,
    
    // Bank Statements
    bank_statement_ytd: process.env.GHL_FIELD_BANK_STATEMENT_YTD!,
    bank_statement_month_1: process.env.GHL_FIELD_BANK_STATEMENT_MONTH_1!,
    bank_statement_month_2: process.env.GHL_FIELD_BANK_STATEMENT_MONTH_2!,
    bank_statement_month_3: process.env.GHL_FIELD_BANK_STATEMENT_MONTH_3!,
    bank_statement_month_4: process.env.GHL_FIELD_BANK_STATEMENT_MONTH_4!,
    
    // Tax Returns
    tax_return_current: process.env.GHL_FIELD_TAX_RETURN_CURRENT!,
    tax_return_last_year: process.env.GHL_FIELD_TAX_RETURN_LAST_YEAR!,
    tax_return_two_years_ago: process.env.GHL_FIELD_TAX_RETURN_TWO_YEARS_AGO!,
    
    // Banking
    voided_check: process.env.GHL_FIELD_VOIDED_CHECK!,
    
    // Workbooks
    debt_schedule_upload: process.env.GHL_FIELD_DEBT_SCHEDULE_UPLOAD!,
    equipment_finance_workbook_upload: process.env.GHL_FIELD_EQUIPMENT_FINANCE_WORKBOOK_UPLOAD!,
    ar_aging_report_upload: process.env.GHL_FIELD_AR_AGING_REPORT_UPLOAD!,
    
    // Financial Statements
    ytd_profit_loss: process.env.GHL_FIELD_YTD_PROFIT_LOSS!,
    ytd_financial_statements: process.env.GHL_FIELD_YTD_FINANCIAL_STATEMENTS!,
    two_year_financials: process.env.GHL_FIELD_TWO_YEAR_FINANCIALS!,
    
    // Invoice Documents
    sample_invoices: process.env.GHL_FIELD_SAMPLE_INVOICES!,
    customer_list: process.env.GHL_FIELD_CUSTOMER_LIST!,
    ap_aging_report: process.env.GHL_FIELD_AP_AGING_REPORT!,
    billing_process: process.env.GHL_FIELD_BILLING_PROCESS!,
    company_background: process.env.GHL_FIELD_COMPANY_BACKGROUND!,
    owner_management_bio: process.env.GHL_FIELD_OWNER_MANAGEMENT_BIO!,
    personal_financial_statement: process.env.GHL_FIELD_PERSONAL_FINANCIAL_STATEMENT!,
  };
  
  return fieldMap[documentId] || null;
}

// Get human-readable label for document type (for GHL tags)
function getDocumentLabel(documentId: string): string {
  const labelMap: Record<string, string> = {
    // Identity Documents
    drivers_license_front: "Driver's License Front",
    drivers_license_back: "Driver's License Back",

    // Bank Statements
    bank_statement_ytd: 'Bank Statement YTD',
    bank_statement_month_1: 'Bank Statement Month 1',
    bank_statement_month_2: 'Bank Statement Month 2',
    bank_statement_month_3: 'Bank Statement Month 3',
    bank_statement_month_4: 'Bank Statement Month 4',

    // Tax Returns
    tax_return_current: 'Tax Return Current',
    tax_return_last_year: 'Tax Return Last Year',
    tax_return_two_years_ago: 'Tax Return 2 Years Ago',

    // Banking
    voided_check: 'Voided Check',

    // Workbooks
    debt_schedule_upload: 'Debt Schedule',
    equipment_finance_workbook_upload: 'Equipment Finance Workbook',
    ar_aging_report_upload: 'AR Aging Report',

    // Financial Statements
    ytd_profit_loss: 'YTD Profit & Loss',
    ytd_financial_statements: 'YTD Financial Statements',
    two_year_financials: '2 Year Financials',

    // Invoice Documents
    sample_invoices: 'Sample Invoices',
    customer_list: 'Customer List',
    ap_aging_report: 'AP Aging Report',
    billing_process: 'Billing Process',
    company_background: 'Company Background',
    owner_management_bio: 'Owner/Management Bio',
    personal_financial_statement: 'Personal Financial Statement',
  };

  return labelMap[documentId] || documentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
