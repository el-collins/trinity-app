// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 02: Create Loan Type Nodes (NO TIERS - Direct Ontology)
// ============================================================================
// Each loan type is a distinct entity with its own properties
// The Agentic layer queries these to dynamically build forms
// ============================================================================

// SBA Loan
MERGE (sba:LoanType {id: 'sba'})
SET
  sba.name = 'SBA Loan',
  sba.display_name = 'Small Business Administration (SBA)',
  sba.description = 'SBA guaranteed loan with extensive documentation requirements',
  sba.ownership_threshold = 20,
  sba.ghl_tag = 'sba_application',
  sba.estimated_fields = 85,
  sba.requires_card_sales = true,
  sba.requires_trade_refs = true,
  sba.requires_bank_refs = true,
  sba.requires_accountant_refs = true,
  sba.requires_extended_legal = true,
  sba.requires_us_citizens = true,
  sba.requires_daily_contact = true,
  sba.requires_extended_business = true,
  sba.requires_equity_check = true,
  sba.requires_mca_details = true,
  sba.has_unique_questions = true,
  sba.unique_question_ids = ['is_franchisee', 'franchisee_entity_name'],
  sba.updated_at = timestamp();

// Line of Credit
MERGE (loc:LoanType {id: 'line_of_credit'})
SET
  loc.name = 'Line of Credit',
  loc.display_name = 'Line of Credit',
  loc.description = 'Revolving credit line for business expenses',
  loc.ownership_threshold = 20,
  loc.ghl_tag = 'loc_application',
  loc.estimated_fields = 55,
  loc.requires_card_sales = true,
  loc.requires_trade_refs = false,
  loc.requires_bank_refs = false,
  loc.requires_accountant_refs = false,
  loc.requires_extended_legal = true,
  loc.requires_us_citizens = false,
  loc.requires_daily_contact = false,
  loc.requires_extended_business = true,
  loc.requires_property_ownership = true,
  loc.requires_mca_details = true,
  loc.has_unique_questions = true,
  loc.unique_question_ids = ['intended_usage_frequency'],
  loc.updated_at = timestamp();

// Merchant Cash Advance (MCA)
MERGE (mca:LoanType {id: 'mca'})
SET
  mca.name = 'Merchant Cash Advance',
  mca.display_name = 'Merchant Cash Advance (MCA)',
  mca.description = 'Quick funding based on future credit card sales',
  mca.ownership_threshold = 20,
  mca.ghl_tag = 'mca_application',
  mca.estimated_fields = 55,
  mca.requires_card_sales = true,
  mca.requires_trade_refs = false,
  mca.requires_bank_refs = false,
  mca.requires_accountant_refs = false,
  mca.requires_extended_legal = true,
  mca.requires_us_citizens = false,
  mca.requires_daily_contact = false,
  mca.requires_extended_business = true,
  mca.requires_property_ownership = true,
  mca.requires_mca_details = true,
  mca.has_unique_questions = true,
  mca.unique_question_ids = ['average_monthly_gross_revenue', 'number_of_daily_transactions', 'current_credit_card_processor', 'average_daily_card_sales'],
  mca.updated_at = timestamp();

// General Application (Unsure of loan type)
MERGE (general:LoanType {id: 'general'})
SET
  general.name = 'General Application',
  general.display_name = 'I\'d Like Some Help Figuring Out What\'s Best',
  general.description = 'For applicants unsure of loan type - comprehensive application',
  general.ownership_threshold = 10,
  general.ghl_tag = 'general_application',
  general.estimated_fields = 85,
  general.requires_card_sales = true,
  general.requires_trade_refs = true,
  general.requires_bank_refs = true,
  general.requires_accountant_refs = true,
  general.requires_extended_legal = true,
  general.requires_us_citizens = true,
  general.requires_daily_contact = true,
  general.requires_extended_business = true,
  general.requires_equity_check = true,
  general.requires_mca_details = true,
  general.has_unique_questions = true,
  general.unique_question_ids = ['is_franchisee', 'franchisee_entity_name'],
  general.updated_at = timestamp();

// Equipment Finance
MERGE (equipment:LoanType {id: 'equipment_finance'})
SET
  equipment.name = 'Equipment Finance',
  equipment.display_name = 'Equipment Financing',
  equipment.description = 'Financing for business equipment purchase or sale-leaseback',
  equipment.ownership_threshold = 10,
  equipment.ghl_tag = 'equipment_application',
  equipment.estimated_fields = 65,
  equipment.requires_card_sales = false,
  equipment.requires_trade_refs = true,
  equipment.requires_bank_refs = true,
  equipment.requires_accountant_refs = false,
  equipment.requires_extended_legal = false,
  equipment.requires_us_citizens = false,
  equipment.requires_daily_contact = false,
  equipment.requires_property_ownership = true,
  equipment.has_unique_questions = true,
  equipment.unique_question_ids = ['equipment_location_same', 'equipment_supplier_name', 'lease_term_months', 'lease_end_option', 'equipment_quantity'],
  equipment.updated_at = timestamp();

// Invoice Factoring
MERGE (factoring:LoanType {id: 'invoice_factoring'})
SET
  factoring.name = 'Invoice Factoring',
  factoring.display_name = 'Invoice Factoring',
  factoring.description = 'Sell invoices for immediate cash - factor handles collections',
  factoring.ownership_threshold = 10,
  factoring.ghl_tag = 'factoring_application',
  factoring.estimated_fields = 75,
  factoring.requires_card_sales = true,
  factoring.requires_trade_refs = true,
  factoring.requires_bank_refs = true,
  factoring.requires_accountant_refs = true,
  factoring.requires_extended_legal = true,
  factoring.requires_us_citizens = false,
  factoring.requires_daily_contact = false,
  factoring.requires_extended_business = true,
  factoring.has_unique_questions = true,
  factoring.unique_question_ids = ['avg_invoice_value_factoring', 'avg_invoice_terms_factoring', 'typical_collection_period_factoring', 'percent_invoices_to_factor', 'total_ar_outstanding_factoring', 'avg_days_invoices_outstanding_factoring', 'active_clients_outstanding_factoring'],
  factoring.updated_at = timestamp();

// Invoice Financing
MERGE (financing:LoanType {id: 'invoice_financing'})
SET
  financing.name = 'Invoice Financing',
  financing.display_name = 'Invoice Financing',
  financing.description = 'Use invoices as collateral for funding - you keep control of collections',
  financing.ownership_threshold = 10,
  financing.ghl_tag = 'financing_application',
  financing.estimated_fields = 95,
  financing.requires_card_sales = false,
  financing.requires_trade_refs = true,
  financing.requires_bank_refs = true,
  financing.requires_accountant_refs = true,
  financing.requires_daily_contact = true,
  financing.requires_accounts_receivable = true,
  financing.has_unique_questions = true,
  financing.unique_question_ids = ['website', 'name_changed', 'business_description', 'related_entities', 'merger_acquisition', 'equity_other_businesses', 'us_citizens_check'],
  financing.updated_at = timestamp();

// Debt Relief (Direct Funnel)
MERGE (dr:LoanType {id: 'debt_relief'})
SET
  dr.name = 'Debt Relief',
  dr.display_name = 'Direct Funnel Debt Relief',
  dr.description = 'Standalone debt relief application - operates independently from financing path',
  dr.ghl_tag = 'debt_relief_application',
  dr.estimated_fields = 40,
  dr.requires_card_sales = false,
  dr.requires_trade_refs = false,
  dr.requires_bank_refs = false,
  dr.requires_accountant_refs = false,
  dr.requires_extended_legal = false,
  dr.requires_us_citizens = false,
  dr.requires_daily_contact = false,
  dr.is_standalone = true,
  dr.has_unique_questions = true,
  dr.unique_question_ids = ['dr_relationship_to_business', 'dr_is_operational', 'dr_number_of_locations', 'dr_revenue_this_year', 'dr_revenue_last_year', 'dr_revenue_two_years_ago'],
  dr.updated_at = timestamp();

// Verify loan types created
MATCH (lt:LoanType)
RETURN lt.id, lt.name, lt.ownership_threshold, lt.requires_trade_refs, lt.requires_bank_refs, lt.requires_accountant_refs
ORDER BY lt.name;
