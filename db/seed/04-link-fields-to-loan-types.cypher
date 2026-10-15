// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 04: Link Fields Directly to Loan Types
// ============================================================================
// This creates REQUIRES_FIELD relationships between LoanTypes and Fields
// Each loan type has its own specific set of fields
// The Agentic layer queries: MATCH (lt:LoanType {id: $loanType})-[:REQUIRES_FIELD]->(f:Field) RETURN f
// ============================================================================

// ===========================================
// COMMON FIELDS - Used by ALL loan types (except Debt Relief which is standalone)
// ===========================================
// NOTE: property_ownership, place_of_operation, num_employees, date_established
// are NOT common - they only appear on specific loan types per spec

// Define common field IDs (shared across Equipment, Factoring, Financing, LOC, MCA, SBA, General)
WITH [
  // Business Info
  'trade_name', 'state_incorporated', 'physical_address', 'city', 'state', 'postal_code',
  'mailing_different', 'mailing_street', 'mailing_city', 'mailing_state', 'mailing_postal',
  // Tax & Control
  'tax_id', 'time_in_control',
  // Legal Basic
  'convicted_crime', 'crime_explanation', 'filed_bankruptcy', 'bankruptcy_when', 'pending_claims',
  // Owner Info (common)
  'owner_full_name', 'owner_phone', 'owner_title', 'owner_home_address', 'owner_dob', 'owner_email',
  'owner_fico', 'owner_ssn', 'owner_dl_state', 'owner_dl_number', 'ownership_percent',
  // Authorization
  'merchant_business_name', 'auth_owner_name', 'auth_owner_title', 'auth_signature', 'auth_date'
] AS commonFields

// Create relationships for all loan types to common fields (exclude quick_app and debt_relief)
MATCH (lt:LoanType)
WHERE lt.id IN ['sba', 'line_of_credit', 'mca', 'general', 'equipment_finance', 'invoice_factoring', 'invoice_financing']
MATCH (f:Field)
WHERE f.id IN commonFields
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// SBA LOAN - Specific Fields
// ===========================================

// SBA uses 20% ownership threshold
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field {id: 'only_owner_20'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field {id: 'additional_owners_count_20'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires card sales
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN ['avg_monthly_card_sales', 'total_monthly_sales', 'annual_gross_sales', 'additional_notes']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA unique fields: Franchisee question + conditional entity name
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN ['is_franchisee', 'franchisee_entity_name']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires extended business info (entities, M&A)
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN [
  'name_changed', 'former_names', 'business_description',
  'related_entity_1', 'related_entity_2', 'related_entity_3', 'related_entity_4',
  'merger_acquisition'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires trade references (full with email, association, duration)
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN [
  'trade_ref_1_company', 'trade_ref_1_phone', 'trade_ref_1_address', 'trade_ref_1_contact',
  'trade_ref_1_email', 'trade_ref_1_association', 'trade_ref_1_duration',
  'trade_ref_2_company', 'trade_ref_2_contact', 'trade_ref_2_address', 'trade_ref_2_phone',
  'trade_ref_2_email', 'trade_ref_2_association', 'trade_ref_2_duration'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires bank references
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN ['bank_name', 'bank_address', 'bank_contact_person', 'bank_contact_phone', 'bank_account_numbers']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires accountant references
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN ['accountant_name', 'accountant_address', 'accountant_email', 'accountant_phone']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires extended legal (UCC, Taxes, US Citizens)
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN ['ucc_filings', 'ucc_filings_with_whom', 'taxes_past_due', 'taxes_past_due_explain', 'us_citizens_check', 'us_citizens_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires daily contact
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN ['daily_contact_name', 'daily_contact_title', 'daily_contact_phone', 'daily_contact_mobile', 'daily_contact_email']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires equity in other businesses
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN ['equity_other_businesses', 'equity_other_businesses_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// SBA requires MCA sub-questions (conditional on high-interest debt)
MATCH (lt:LoanType {id: 'sba'})
MATCH (f:Field)
WHERE f.id IN [
  'mca_count', 'mca_lender_1', 'mca_amount_1', 'mca_lender_2', 'mca_amount_2',
  'mca_lender_3', 'mca_amount_3', 'mca_lender_4', 'mca_amount_4', 'mca_lender_5', 'mca_amount_5'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// LINE OF CREDIT - Specific Fields
// ===========================================

// LOC uses 20% ownership threshold
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field {id: 'only_owner_20'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field {id: 'additional_owners_count_20'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// LOC requires card sales
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field)
WHERE f.id IN ['avg_monthly_card_sales', 'total_monthly_sales', 'annual_gross_sales', 'additional_notes']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// LOC unique field: Intended Usage Frequency
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field {id: 'intended_usage_frequency'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// LOC requires extended business info (name change, business description)
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field)
WHERE f.id IN ['name_changed', 'former_names', 'business_description']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// LOC requires property ownership and place of operation
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field)
WHERE f.id IN ['property_ownership', 'property_ownership_other', 'place_of_operation', 'place_operation_other']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// LOC requires home ownership (separate from Quick App)
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field)
WHERE f.id IN ['home_ownership_status', 'home_ownership_other']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// LOC requires extended legal (UCC, Taxes - but NOT US Citizens)
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field)
WHERE f.id IN ['ucc_filings', 'ucc_filings_with_whom', 'taxes_past_due', 'taxes_past_due_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// LOC requires MCA sub-questions (conditional on high-interest debt)
MATCH (lt:LoanType {id: 'line_of_credit'})
MATCH (f:Field)
WHERE f.id IN [
  'mca_count', 'mca_lender_1', 'mca_amount_1', 'mca_lender_2', 'mca_amount_2',
  'mca_lender_3', 'mca_amount_3', 'mca_lender_4', 'mca_amount_4', 'mca_lender_5', 'mca_amount_5'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// MCA - Specific Fields
// ===========================================

// MCA uses 20% ownership threshold
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field {id: 'only_owner_20'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field {id: 'additional_owners_count_20'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// MCA requires card sales
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field)
WHERE f.id IN ['avg_monthly_card_sales', 'total_monthly_sales', 'annual_gross_sales', 'additional_notes']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// MCA-specific financial fields (floating questions)
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field)
WHERE f.id IN [
  'average_monthly_gross_revenue', 'number_of_daily_transactions',
  'current_credit_card_processor', 'credit_card_processor_other',
  'average_daily_card_sales'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// MCA requires extended business info (name change, business description)
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field)
WHERE f.id IN ['name_changed', 'former_names', 'business_description']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// MCA requires property ownership and place of operation
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field)
WHERE f.id IN ['property_ownership', 'property_ownership_other', 'place_of_operation', 'place_operation_other']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// MCA requires home ownership
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field)
WHERE f.id IN ['home_ownership_status', 'home_ownership_other']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// MCA requires extended legal (UCC, Taxes - but NOT US Citizens)
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field)
WHERE f.id IN ['ucc_filings', 'ucc_filings_with_whom', 'taxes_past_due', 'taxes_past_due_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// MCA requires MCA sub-questions (conditional on high-interest debt)
MATCH (lt:LoanType {id: 'mca'})
MATCH (f:Field)
WHERE f.id IN [
  'mca_count', 'mca_lender_1', 'mca_amount_1', 'mca_lender_2', 'mca_amount_2',
  'mca_lender_3', 'mca_amount_3', 'mca_lender_4', 'mca_amount_4', 'mca_lender_5', 'mca_amount_5'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// GENERAL APPLICATION (Unsure) - Specific Fields
// ===========================================

// General uses 10% ownership threshold
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field {id: 'only_owner_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field {id: 'additional_owners_count_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires card sales
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN ['avg_monthly_card_sales', 'total_monthly_sales', 'annual_gross_sales', 'additional_notes']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires franchisee question
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN ['is_franchisee', 'franchisee_entity_name']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires extended business info (entities, M&A)
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN [
  'name_changed', 'former_names', 'business_description',
  'related_entity_1', 'related_entity_2', 'related_entity_3', 'related_entity_4',
  'merger_acquisition'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires trade references (full with email, association, duration)
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN [
  'trade_ref_1_company', 'trade_ref_1_phone', 'trade_ref_1_address', 'trade_ref_1_contact',
  'trade_ref_1_email', 'trade_ref_1_association', 'trade_ref_1_duration',
  'trade_ref_2_company', 'trade_ref_2_contact', 'trade_ref_2_address', 'trade_ref_2_phone',
  'trade_ref_2_email', 'trade_ref_2_association', 'trade_ref_2_duration'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires bank references
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN ['bank_name', 'bank_address', 'bank_contact_person', 'bank_contact_phone', 'bank_account_numbers']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires accountant references
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN ['accountant_name', 'accountant_address', 'accountant_email', 'accountant_phone']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires extended legal (UCC, Taxes, US Citizens)
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN ['ucc_filings', 'ucc_filings_with_whom', 'taxes_past_due', 'taxes_past_due_explain', 'us_citizens_check', 'us_citizens_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires daily contact
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN ['daily_contact_name', 'daily_contact_title', 'daily_contact_phone', 'daily_contact_mobile', 'daily_contact_email']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires equity in other businesses
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN ['equity_other_businesses', 'equity_other_businesses_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// General requires MCA sub-questions (conditional on high-interest debt)
MATCH (lt:LoanType {id: 'general'})
MATCH (f:Field)
WHERE f.id IN [
  'mca_count', 'mca_lender_1', 'mca_amount_1', 'mca_lender_2', 'mca_amount_2',
  'mca_lender_3', 'mca_amount_3', 'mca_lender_4', 'mca_amount_4', 'mca_lender_5', 'mca_amount_5'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// EQUIPMENT FINANCE - Specific Fields
// ===========================================

// Equipment uses 10% ownership threshold
MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field {id: 'only_owner_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field {id: 'additional_owners_count_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Equipment does NOT require card sales, just total/annual
MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field)
WHERE f.id IN ['total_monthly_sales', 'annual_gross_sales', 'additional_notes']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Equipment specific fields
MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field)
WHERE f.id IN [
  // Equipment detail fields
  'equipment_type', 'equipment_type_other', 'equipment_value',
  'equipment_condition', 'equipment_sourcing_method', 'equipment_vendor', 'equipment_delivery_date',
  // Equipment location fields
  'equipment_location_same', 'equipment_location_type', 'equipment_street', 'equipment_city',
  'equipment_state', 'equipment_postal',
  // Supplier/Lease fields
  'equipment_supplier_name', 'equipment_supplier_contact',
  'lease_term_months', 'lease_end_option', 'lease_end_option_other',
  'equipment_quantity', 'equipment_quantity_count'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Equipment requires property ownership and place of operation
MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field)
WHERE f.id IN ['property_ownership', 'property_ownership_other', 'place_of_operation', 'place_operation_other']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Equipment requires trade references (basic - no email/association/duration per spec)
MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field)
WHERE f.id IN [
  'trade_ref_1_company', 'trade_ref_1_phone', 'trade_ref_1_address', 'trade_ref_1_contact',
  'trade_ref_2_company', 'trade_ref_2_contact', 'trade_ref_2_address', 'trade_ref_2_phone'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Equipment requires bank references
MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field)
WHERE f.id IN ['bank_name', 'bank_address', 'bank_contact_person', 'bank_contact_phone', 'bank_account_numbers']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// INVOICE FACTORING - Specific Fields
// ===========================================

// Factoring uses 10% ownership threshold
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field {id: 'only_owner_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field {id: 'additional_owners_count_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Factoring requires card sales
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field)
WHERE f.id IN ['avg_monthly_card_sales', 'total_monthly_sales', 'annual_gross_sales', 'additional_notes']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Factoring requires extended business info (name change, description - but NOT entities/M&A)
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field)
WHERE f.id IN ['name_changed', 'former_names', 'business_description']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Factoring requires trade references (full)
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field)
WHERE f.id IN [
  'trade_ref_1_company', 'trade_ref_1_phone', 'trade_ref_1_address', 'trade_ref_1_contact',
  'trade_ref_1_email', 'trade_ref_1_association', 'trade_ref_1_duration',
  'trade_ref_2_company', 'trade_ref_2_contact', 'trade_ref_2_address', 'trade_ref_2_phone',
  'trade_ref_2_email', 'trade_ref_2_association', 'trade_ref_2_duration'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Factoring requires bank references
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field)
WHERE f.id IN ['bank_name', 'bank_address', 'bank_contact_person', 'bank_contact_phone', 'bank_account_numbers']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Factoring requires accountant references
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field)
WHERE f.id IN ['accountant_name', 'accountant_address', 'accountant_email', 'accountant_phone']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Factoring requires extended legal (UCC, Taxes - but NOT US Citizens)
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field)
WHERE f.id IN ['ucc_filings', 'ucc_filings_with_whom', 'taxes_past_due', 'taxes_past_due_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Factoring specific fields
MATCH (lt:LoanType {id: 'invoice_factoring'})
MATCH (f:Field)
WHERE f.id IN [
  'avg_invoice_value_factoring', 'avg_invoice_terms_factoring', 'typical_collection_period_factoring',
  'percent_invoices_to_factor', 'total_ar_outstanding_factoring', 'avg_days_invoices_outstanding_factoring',
  'active_clients_outstanding_factoring'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// INVOICE FINANCING - Specific Fields (Most comprehensive)
// ===========================================

// Financing uses 10% ownership threshold
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field {id: 'only_owner_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field {id: 'additional_owners_count_10'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing does NOT require card sales, just total/annual
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN ['total_monthly_sales', 'annual_gross_sales', 'additional_notes']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires full extended business info (entities, M&A)
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN [
  'name_changed', 'former_names', 'business_description',
  'related_entity_1', 'related_entity_2', 'related_entity_3', 'related_entity_4',
  'merger_acquisition'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires trade references (full)
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN [
  'trade_ref_1_company', 'trade_ref_1_phone', 'trade_ref_1_address', 'trade_ref_1_contact',
  'trade_ref_1_email', 'trade_ref_1_association', 'trade_ref_1_duration',
  'trade_ref_2_company', 'trade_ref_2_contact', 'trade_ref_2_address', 'trade_ref_2_phone',
  'trade_ref_2_email', 'trade_ref_2_association', 'trade_ref_2_duration'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires bank references
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN ['bank_name', 'bank_address', 'bank_contact_person', 'bank_contact_phone', 'bank_account_numbers']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires accountant references
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN ['accountant_name', 'accountant_address', 'accountant_email', 'accountant_phone']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires extended legal fields including US citizens check
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN ['ucc_filings', 'ucc_filings_with_whom', 'taxes_past_due', 'taxes_past_due_explain', 'us_citizens_check', 'us_citizens_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires daily contact
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN ['daily_contact_name', 'daily_contact_title', 'daily_contact_phone', 'daily_contact_mobile', 'daily_contact_email']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires owner equity in other businesses
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN ['equity_other_businesses', 'equity_other_businesses_explain']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing requires full accounts receivable section
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN [
  'total_customers', 'domestic_customers', 'foreign_customers', 'open_invoices_amount',
  'invoices_per_month', 'terms_discounts', 'anticipated_monthly_financing',
  'assets_pledged', 'pledge_to_1', 'pledge_to_2', 'pledge_to_3', 'pledge_to_4', 'pledge_to_5',
  'bill_and_holds', 'guaranteed_sales_offset', 'accept_deposits'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financing specific invoice fields (including percentage to factor)
MATCH (lt:LoanType {id: 'invoice_financing'})
MATCH (f:Field)
WHERE f.id IN [
  'avg_invoice_value_financing', 'avg_invoice_terms_financing', 'typical_collection_period_financing',
  'percent_invoices_to_finance', 'total_ar_outstanding_financing', 'avg_days_invoices_outstanding_financing',
  'active_clients_outstanding_financing'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// DEBT RELIEF - Specific Fields (Standalone application)
// ===========================================

// Debt Relief contact fields (reuses some + has its own)
MATCH (lt:LoanType {id: 'debt_relief'})
MATCH (f:Field)
WHERE f.id IN ['first_name', 'last_name', 'business_email', 'dr_business_phone', 'dr_mobile_phone', 'dr_company_website']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Debt Relief business info (reuses some common + its own unique fields)
MATCH (lt:LoanType {id: 'debt_relief'})
MATCH (f:Field)
WHERE f.id IN [
  'trade_name', 'dr_relationship_to_business', 'state_incorporated',
  'physical_address', 'city', 'state', 'postal_code',
  'mailing_different', 'mailing_street', 'mailing_city', 'mailing_state', 'mailing_postal',
  'tax_id', 'dr_is_operational', 'time_in_control',
  'name_changed', 'former_names', 'business_description', 'dr_w2_employees', 'dr_debt_schedule_link'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Debt Relief location and franchise
MATCH (lt:LoanType {id: 'debt_relief'})
MATCH (f:Field)
WHERE f.id IN ['dr_number_of_locations', 'dr_is_franchisee', 'dr_franchisee_entity']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Debt Relief debt information
MATCH (lt:LoanType {id: 'debt_relief'})
MATCH (f:Field)
WHERE f.id IN ['dr_total_debt', 'dr_monthly_payment', 'dr_has_high_interest', 'dr_high_interest_amount', 'dr_high_interest_monthly']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Debt Relief accountant/bookkeeper references
MATCH (lt:LoanType {id: 'debt_relief'})
MATCH (f:Field)
WHERE f.id IN ['dr_accountant_business_name', 'dr_accountant_name', 'dr_accountant_address', 'dr_accountant_email', 'dr_accountant_phone']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Debt Relief revenue information
MATCH (lt:LoanType {id: 'debt_relief'})
MATCH (f:Field)
WHERE f.id IN ['dr_revenue_this_year', 'dr_revenue_last_year', 'dr_revenue_two_years_ago']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// WORKBOOK FIELDS - Link to appropriate loan types
// ===========================================

// Debt Schedule Workbook - Required for SBA, LOC, MCA, General, Equipment Finance
MATCH (lt:LoanType)
WHERE lt.id IN ['sba', 'line_of_credit', 'mca', 'general', 'equipment_finance']
MATCH (f:Field {id: 'debt_schedule_workbook'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Equipment Finance Workbook - Only for Equipment Finance
MATCH (lt:LoanType {id: 'equipment_finance'})
MATCH (f:Field {id: 'equipment_finance_workbook'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// AR Aging Workbook - Required for Invoice Factoring and Invoice Financing
MATCH (lt:LoanType)
WHERE lt.id IN ['invoice_factoring', 'invoice_financing']
MATCH (f:Field {id: 'ar_aging_workbook'})
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// VERIFICATION QUERIES
// ===========================================

// Count fields per loan type
MATCH (lt:LoanType)-[:REQUIRES_FIELD]->(f:Field)
RETURN lt.id, lt.name, count(f) as field_count
ORDER BY field_count DESC;
