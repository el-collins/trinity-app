// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 08: Create Quick App Loan Type & Link Fields
// ============================================================================
// Creates the Quick App as a special "Tier 0" loan type
// Links Quick App fields + shared contact fields
// ============================================================================

// Create Quick App loan type
MERGE (qa:LoanType {id: 'quick_app'})
SET
  qa.name = 'Quick Application',
  qa.display_name = 'Quick Application',
  qa.description = 'Initial application to capture basic info before loan type selection',
  qa.tier = 0,
  qa.estimated_time = 10,
  qa.ghl_tag = 'quick_app_completed',
  qa.is_preliminary = true,
  qa.updated_at = timestamp();

// ===========================================
// LINK SHARED CONTACT FIELDS (from full apps)
// ===========================================

// Quick App reuses these contact fields from full applications
MATCH (lt:LoanType {id: 'quick_app'})
MATCH (f:Field)
WHERE f.id IN ['first_name', 'last_name', 'business_email', 'business_phone', 'mobile_phone']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// LINK QUICK APP SPECIFIC FIELDS
// ===========================================

// Contact section fields
MATCH (lt:LoanType {id: 'quick_app'})
MATCH (f:Field)
WHERE f.id IN ['legal_business_name', 'sms_consent', 'marketing_consent', 'website']
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Business section fields
MATCH (lt:LoanType {id: 'quick_app'})
MATCH (f:Field)
WHERE f.id IN [
  'entity_type', 'entity_type_other', 'industry', 'industry_other',
  'quick_business_description', 'time_in_business', 'w2_employee_count',
  'contractor_count', 'annual_revenue', 'net_income', 'fico_score_range', 'bank_account_type'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// Financial qualification section fields
MATCH (lt:LoanType {id: 'quick_app'})
MATCH (f:Field)
WHERE f.id IN [
  'use_of_funds', 'urgency', 'background_info', 'home_ownership_status', 'home_ownership_other',
  'desired_funding_amount', 'has_current_debt', 'total_debt_amount',
  'monthly_debt_payment', 'has_high_interest_debt', 'high_interest_debt_amount',
  'high_interest_monthly_payment', 'know_loan_type'
]
MERGE (lt)-[:REQUIRES_FIELD]->(f);

// ===========================================
// CREATE CONDITIONAL RELATIONSHIPS FOR QUICK APP
// ===========================================

// Entity type other
MATCH (trigger:Field {id: 'entity_type'})
MATCH (dependent:Field {id: 'entity_type_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// Industry other
MATCH (trigger:Field {id: 'industry'})
MATCH (dependent:Field {id: 'industry_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// Debt fields
MATCH (trigger:Field {id: 'has_current_debt'})
MATCH (dependent:Field)
WHERE dependent.id IN ['total_debt_amount', 'monthly_debt_payment', 'has_high_interest_debt']
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// High interest debt fields
MATCH (trigger:Field {id: 'has_high_interest_debt'})
MATCH (dependent:Field)
WHERE dependent.id IN ['high_interest_debt_amount', 'high_interest_monthly_payment']
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// Home ownership other explanation
MATCH (trigger:Field {id: 'home_ownership_status'})
MATCH (dependent:Field {id: 'home_ownership_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// ===========================================
// VERIFICATION
// ===========================================

// Count fields for Quick App
MATCH (lt:LoanType {id: 'quick_app'})-[:REQUIRES_FIELD]->(f:Field)
RETURN lt.name, count(f) as field_count;

// List all Quick App fields by section
MATCH (lt:LoanType {id: 'quick_app'})-[:REQUIRES_FIELD]->(f:Field)
RETURN f.section, collect(f.id) as fields
ORDER BY f.section;
