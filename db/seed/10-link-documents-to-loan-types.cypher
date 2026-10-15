// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 10: Link Documents to Loan Types
// ============================================================================
// Creates REQUIRES_DOCUMENT relationships between loan types and documents
// Each loan type has specific document requirements based on GHL surveys
// ============================================================================

// ===========================================
// SBA LOAN DOCUMENTS
// ===========================================

MATCH (lt:LoanType {id: 'sba'})
MATCH (d:Document)
WHERE d.id IN [
  'drivers_license_front',
  'drivers_license_back',
  'bank_statement_ytd',
  'bank_statement_month_1',
  'bank_statement_month_2',
  'bank_statement_month_3',
  'bank_statement_month_4',
  'tax_return_current',
  'tax_return_last_year',
  'voided_check',
  'debt_schedule_link',
  'debt_schedule_upload',
  'ytd_profit_loss',
  'ytd_financial_statements',
  'two_year_financials'
]
MERGE (lt)-[:REQUIRES_DOCUMENT]->(d);

// ===========================================
// LINE OF CREDIT DOCUMENTS
// ===========================================

MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (d:Document)
WHERE d.id IN [
  'drivers_license_front',
  'drivers_license_back',
  'bank_statement_ytd',
  'bank_statement_month_1',
  'bank_statement_month_2',
  'bank_statement_month_3',
  'bank_statement_month_4',
  'tax_return_current',
  'tax_return_last_year',
  'voided_check',
  'debt_schedule_link',
  'debt_schedule_upload'
]
MERGE (lt)-[:REQUIRES_DOCUMENT]->(d);

// ===========================================
// MCA (MERCHANT CASH ADVANCE) DOCUMENTS
// ===========================================

MATCH (lt:LoanType {id: 'mca'})
MATCH (d:Document)
WHERE d.id IN [
  'drivers_license_front',
  'drivers_license_back',
  'bank_statement_ytd',
  'bank_statement_month_1',
  'bank_statement_month_2',
  'bank_statement_month_3',
  'bank_statement_month_4',
  'tax_return_current',
  'tax_return_last_year',
  'voided_check',
  'debt_schedule_link',
  'debt_schedule_upload'
]
MERGE (lt)-[:REQUIRES_DOCUMENT]->(d);

// ===========================================
// GENERAL LOAN DOCUMENTS
// ===========================================

MATCH (lt:LoanType {id: 'general'})
MATCH (d:Document)
WHERE d.id IN [
  'drivers_license_front',
  'drivers_license_back',
  'bank_statement_ytd',
  'bank_statement_month_1',
  'bank_statement_month_2',
  'bank_statement_month_3',
  'bank_statement_month_4',
  'tax_return_current',
  'tax_return_last_year',
  'voided_check',
  'debt_schedule_link',
  'debt_schedule_upload'
]
MERGE (lt)-[:REQUIRES_DOCUMENT]->(d);

// ===========================================
// EQUIPMENT FINANCE DOCUMENTS
// ===========================================

MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (d:Document)
WHERE d.id IN [
  'drivers_license_front',
  'drivers_license_back',
  'tax_return_current',
  'tax_return_last_year',
  'tax_return_two_years_ago',
  'voided_check',
  'debt_schedule_link',
  'debt_schedule_upload',
  'equipment_finance_workbook_link',
  'equipment_finance_workbook_upload',
  'ytd_financial_statements',
  'two_year_financials'
]
MERGE (lt)-[:REQUIRES_DOCUMENT]->(d);

// ===========================================
// INVOICE FACTORING DOCUMENTS
// ===========================================

MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (d:Document)
WHERE d.id IN [
  'drivers_license_front',
  'drivers_license_back',
  'bank_statement_ytd',
  'bank_statement_month_1',
  'bank_statement_month_2',
  'bank_statement_month_3',
  'bank_statement_month_4',
  'voided_check',
  'ar_aging_report_link',
  'ar_aging_report_upload',
  'sample_invoices',
  'customer_list',
  'ap_aging_report',
  'billing_process',
  'company_background',
  'owner_management_bio',
  'personal_financial_statement',
  'ytd_financial_statements',
  'two_year_financials'
]
MERGE (lt)-[:REQUIRES_DOCUMENT]->(d);

// ===========================================
// INVOICE FINANCING DOCUMENTS
// ===========================================

MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (d:Document)
WHERE d.id IN [
  'drivers_license_front',
  'drivers_license_back',
  'bank_statement_ytd',
  'bank_statement_month_1',
  'bank_statement_month_2',
  'bank_statement_month_3',
  'bank_statement_month_4',
  'voided_check',
  'ar_aging_report_link',
  'ar_aging_report_upload',
  'sample_invoices',
  'customer_list',
  'ap_aging_report',
  'billing_process',
  'company_background',
  'owner_management_bio',
  'personal_financial_statement',
  'ytd_financial_statements',
  'two_year_financials'
]
MERGE (lt)-[:REQUIRES_DOCUMENT]->(d);

// ===========================================
// VERIFICATION QUERIES
// ===========================================

// Count documents per loan type
MATCH (lt:LoanType)-[:REQUIRES_DOCUMENT]->(d:Document)
RETURN lt.name as loan_type, count(d) as document_count
ORDER BY lt.name;

// List documents for each loan type
MATCH (lt:LoanType)-[:REQUIRES_DOCUMENT]->(d:Document)
RETURN lt.name as loan_type, collect(d.name) as required_documents
ORDER BY lt.name;

// Find documents required by all loan types (common documents)
MATCH (d:Document)
WHERE ALL(lt IN [(d)<-[:REQUIRES_DOCUMENT]-(lt:LoanType) | lt] WHERE lt IS NOT NULL)
WITH d, size([(d)<-[:REQUIRES_DOCUMENT]-(lt:LoanType) | lt]) as loan_count
WHERE loan_count = 7
RETURN d.id, d.name as common_document;

// Find documents unique to specific loan types
MATCH (d:Document)<-[:REQUIRES_DOCUMENT]-(lt:LoanType)
WITH d, collect(lt.name) as loan_types
WHERE size(loan_types) = 1
RETURN d.id, d.name, loan_types[0] as unique_to;

// Document category breakdown per loan type
MATCH (lt:LoanType)-[:REQUIRES_DOCUMENT]->(d:Document)
RETURN lt.name as loan_type, d.category, count(d) as count
ORDER BY lt.name, d.category;
