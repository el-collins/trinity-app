// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 09: Create Document Nodes for Document Collection
// ============================================================================
// Defines all document types required for loan applications
// Documents are linked to loan types in Script 10
// ============================================================================

// ===========================================
// IDENTITY DOCUMENTS
// ===========================================

MERGE (d:Document {id: 'drivers_license_front'})
SET d.name = 'Front of Driver\'s License (Please Be Visible in The Picture)',
    d.description = 'Selfie with front of driver\'s license - you must be visible in the photo',
    d.required = true,
    d.acceptedFormats = ['JPG', 'PNG', 'PDF'],
    d.maxFileSizeMB = 5,
    d.order = 1,
    d.category = 'identity';

MERGE (d:Document {id: 'drivers_license_back'})
SET d.name = 'Back of Driver\'s License',
    d.description = 'Clear photo of the back of your driver\'s license',
    d.required = true,
    d.acceptedFormats = ['JPG', 'PNG', 'PDF'],
    d.maxFileSizeMB = 5,
    d.order = 2,
    d.category = 'identity';

// ===========================================
// BANK STATEMENTS (5 MONTHS)
// ===========================================

MERGE (d:Document {id: 'bank_statement_ytd'})
SET d.name = 'Bank Statements - Current Month YTD',
    d.description = 'Year-to-date bank statements for the current month',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 3,
    d.category = 'financial';

MERGE (d:Document {id: 'bank_statement_month_1'})
SET d.name = 'Bank Statements - Last Month',
    d.description = 'Complete bank statements for last month',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 4,
    d.category = 'financial';

MERGE (d:Document {id: 'bank_statement_month_2'})
SET d.name = 'Bank Statements - Two Months Ago',
    d.description = 'Complete bank statements from two months ago',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 5,
    d.category = 'financial';

MERGE (d:Document {id: 'bank_statement_month_3'})
SET d.name = 'Bank Statements - Three Months Ago',
    d.description = 'Complete bank statements from three months ago',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 6,
    d.category = 'financial';

MERGE (d:Document {id: 'bank_statement_month_4'})
SET d.name = 'Bank Statements - Four Months Ago',
    d.description = 'Complete bank statements from four months ago',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 7,
    d.category = 'financial';

// ===========================================
// TAX RETURNS
// ===========================================

MERGE (d:Document {id: 'tax_return_current'})
SET d.name = 'Most Recent Business Tax Return',
    d.description = 'Complete business tax return for the most recent year',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 8,
    d.category = 'tax';

MERGE (d:Document {id: 'tax_return_last_year'})
SET d.name = 'Last Year\'s Business Tax Return',
    d.description = 'Complete business tax return for the previous year',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 9,
    d.category = 'tax';

MERGE (d:Document {id: 'tax_return_two_years_ago'})
SET d.name = 'Two Years Ago Business Tax Return',
    d.description = 'Complete business tax return from two years ago',
    d.required = false,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 10,
    d.category = 'tax';

// ===========================================
// BANKING DOCUMENTS
// ===========================================

MERGE (d:Document {id: 'voided_check'})
SET d.name = 'Photo/Scan of Business\' Voided Check',
    d.description = 'Photo or scan of a voided business check',
    d.required = true,
    d.acceptedFormats = ['PDF', 'JPG', 'PNG'],
    d.maxFileSizeMB = 5,
    d.order = 11,
    d.category = 'banking';

// ===========================================
// WORKBOOKS & SCHEDULES
// ===========================================

MERGE (d:Document {id: 'debt_schedule_link'})
SET d.name = 'Debt Schedule Workbook Link',
    d.description = 'Link to your completed Debt Schedule workbook. Click the template link to make a copy, fill it out, and paste your link here.',
    d.required = true,
    d.type = 'link',
    d.order = 12,
    d.category = 'workbook',
    d.template_url = 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy';

MERGE (d:Document {id: 'debt_schedule_upload'})
SET d.name = 'Debt Schedule Workbook Upload',
    d.description = 'Upload your completed Debt Schedule workbook (if you already have one)',
    d.required = false,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 5,
    d.order = 13,
    d.category = 'workbook';

MERGE (d:Document {id: 'equipment_finance_workbook_link'})
SET d.name = 'Equipment Finance Workbook Link',
    d.description = 'Link to your completed Equipment Finance workbook. Click the template link to make a copy, fill it out, and paste your link here.',
    d.required = true,
    d.type = 'link',
    d.order = 14,
    d.category = 'workbook',
    d.template_url = 'https://docs.google.com/spreadsheets/d/1nF_E7Fw67oZEDjTngK7yU2G3FQoSE0-09G1r4vu7_Y4/copy';

MERGE (d:Document {id: 'equipment_finance_workbook_upload'})
SET d.name = 'Equipment Finance Workbook Upload',
    d.description = 'Upload your completed Equipment Finance workbook (if you already have one)',
    d.required = false,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 5,
    d.order = 15,
    d.category = 'workbook';

MERGE (d:Document {id: 'ar_aging_report_link'})
SET d.name = 'Accounts Receivable Aging Report Link',
    d.description = 'Link to your completed AR aging report workbook. Click the template link to make a copy, fill it out, and paste your link here.',
    d.required = true,
    d.type = 'link',
    d.order = 16,
    d.category = 'workbook',
    d.template_url = 'https://docs.google.com/spreadsheets/d/1sU7B_5_0eDjUFxF4m91TqxXGM9VftZxGr5kk-xdHsGI/copy';

MERGE (d:Document {id: 'ar_aging_report_upload'})
SET d.name = 'Accounts Receivable Aging Report Upload',
    d.description = 'Upload your AR aging report (if you already have one)',
    d.required = false,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 10,
    d.order = 17,
    d.category = 'workbook';

// ===========================================
// FINANCIAL STATEMENTS
// ===========================================

MERGE (d:Document {id: 'ytd_profit_loss'})
SET d.name = 'Year-to-Date Profit & Loss Statement(s)',
    d.description = 'Current year-to-date P&L statement',
    d.required = false,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 5,
    d.order = 18,
    d.category = 'financial';

MERGE (d:Document {id: 'ytd_financial_statements'})
SET d.name = 'Interim (Year-To-Date) Financial Statements',
    d.description = 'Current year-to-date financial statements',
    d.required = true,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 10,
    d.order = 19,
    d.category = 'financial';

MERGE (d:Document {id: 'two_year_financials'})
SET d.name = 'Most Recent 2 Years\' Fiscal Year End Financials (Accountant Prepared)',
    d.description = 'Accountant-prepared financial statements for the last 2 years',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 20,
    d.category = 'financial';

// ===========================================
// INVOICE FINANCING/FACTORING SPECIFIC DOCUMENTS
// ===========================================

MERGE (d:Document {id: 'sample_invoices'})
SET d.name = 'Sample Invoice Along with Corresponding Support',
    d.description = 'Sample invoices with master contracts, purchase orders, work orders, etc.',
    d.required = true,
    d.acceptedFormats = ['PDF'],
    d.maxFileSizeMB = 10,
    d.order = 21,
    d.category = 'invoices';

MERGE (d:Document {id: 'customer_list'})
SET d.name = 'Customer List (City/State, email & phone)',
    d.description = 'List of customers with contact information',
    d.required = true,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 5,
    d.order = 22,
    d.category = 'business';

MERGE (d:Document {id: 'ap_aging_report'})
SET d.name = 'Current Accounts Payable Aging Report (Invoice Data)',
    d.description = 'Detailed accounts payable aging report',
    d.required = true,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 10,
    d.order = 23,
    d.category = 'financial';

MERGE (d:Document {id: 'billing_process'})
SET d.name = 'Billing Process',
    d.description = 'Description of your billing process',
    d.required = true,
    d.acceptedFormats = ['PDF', 'DOCX', 'TXT'],
    d.maxFileSizeMB = 5,
    d.order = 24,
    d.category = 'business';

MERGE (d:Document {id: 'company_background'})
SET d.name = 'A Brief Background, History / Summary of the Company',
    d.description = 'Company background and history',
    d.required = true,
    d.acceptedFormats = ['PDF', 'DOCX', 'TXT'],
    d.maxFileSizeMB = 5,
    d.order = 25,
    d.category = 'business';

MERGE (d:Document {id: 'owner_management_bio'})
SET d.name = 'A Brief Bio of Owners / Senior Management / Corporate Affiliates and Subsidiaries',
    d.description = 'Biographies of key personnel',
    d.required = true,
    d.acceptedFormats = ['PDF', 'DOCX', 'TXT'],
    d.maxFileSizeMB = 5,
    d.order = 26,
    d.category = 'business';

MERGE (d:Document {id: 'personal_financial_statement'})
SET d.name = 'Completed Personal Financial Statement',
    d.description = 'Personal financial statement for business owners',
    d.required = true,
    d.acceptedFormats = ['PDF', 'XLSX', 'XLS'],
    d.maxFileSizeMB = 5,
    d.order = 27,
    d.category = 'financial';

// ===========================================
// VERIFICATION
// ===========================================

// Count documents by category
MATCH (d:Document)
RETURN d.category, count(d) as document_count
ORDER BY d.category;

// List all documents
MATCH (d:Document)
RETURN d.id, d.name, d.category, d.required
ORDER BY d.order;
