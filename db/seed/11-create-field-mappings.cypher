// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 11: Create Field Mappings & Derivation Relationships
// ============================================================================
// This script creates DERIVES_FROM relationships between fields
// These relationships tell the Agentic layer how to compute field values
// from Quick App data when transitioning to Full Applications
// ============================================================================

// ===========================================
// EMPLOYEE COUNT DERIVATION
// ===========================================
// Quick App asks for W2 employees and contractors separately
// Full Apps ask for total number of employees
// Formula: num_employees = w2_employee_count + contractor_count

MATCH (target:Field {id: 'num_employees'})
MATCH (source1:Field {id: 'w2_employee_count'})
MATCH (source2:Field {id: 'contractor_count'})
MERGE (target)-[:DERIVES_FROM {
  formula: 'sum',
  description: 'Total employees = W2 employees + 1099 contractors',
  priority: 1
}]->(source1)
MERGE (target)-[:DERIVES_FROM {
  formula: 'sum',
  description: 'Total employees = W2 employees + 1099 contractors',
  priority: 2
}]->(source2);

// ===========================================
// FICO SCORE DERIVATION
// ===========================================
// Quick App asks for FICO range (e.g., "670-739")
// Full Apps ask for exact FICO score
// Formula: Use midpoint of selected range
// NOTE: Mapping keys MUST match Quick App options exactly from Script 07

MATCH (target:Field {id: 'owner_fico'})
MATCH (source:Field {id: 'fico_score_range'})
MERGE (target)-[:DERIVES_FROM {
  formula: 'range_midpoint',
  description: 'Use midpoint of FICO range as estimate',
  mapping: '{
    "Below 580": 550,
    "580-669": 625,
    "670-739": 705,
    "740-799": 770,
    "800+": 825,
    "Unknown": null
  }',
  editable: true,
  priority: 1
}]->(source);

// ===========================================
// BUSINESS DESCRIPTION MAPPING
// ===========================================
// Quick App has a brief business description
// Full Apps have more detailed description field
// Direct copy with option to expand

MATCH (target:Field {id: 'business_description'})
MATCH (source:Field {id: 'quick_business_description'})
MERGE (target)-[:DERIVES_FROM {
  formula: 'copy',
  description: 'Copy Quick App description as starting point',
  editable: true,
  priority: 1
}]->(source);

// ===========================================
// ANNUAL REVENUE MAPPING
// ===========================================
// Quick App collects annual_revenue
// Full Apps have annual_gross_sales
// Same concept, different field names

MATCH (target:Field {id: 'annual_gross_sales'})
MATCH (source:Field {id: 'annual_revenue'})
MERGE (target)-[:DERIVES_FROM {
  formula: 'copy',
  description: 'Annual revenue maps directly to annual gross sales',
  editable: true,
  priority: 1
}]->(source);

// ===========================================
// FUNDING AMOUNT MAPPING
// ===========================================
// Quick App has desired_funding_amount
// This can pre-populate loan amount fields in full apps

MATCH (target:Field {id: 'equipment_value'})
MATCH (source:Field {id: 'desired_funding_amount'})
MERGE (target)-[:DERIVES_FROM {
  formula: 'copy',
  description: 'Use desired funding as initial equipment value estimate',
  editable: true,
  priority: 1
}]->(source);

// ===========================================
// TIME IN BUSINESS MAPPING
// ===========================================
// Quick App collects time_in_business
// Full Apps have date_established
// Reverse calculation possible

MATCH (qa_field:Field {id: 'time_in_business'})
MATCH (full_field:Field {id: 'date_established'})
MERGE (qa_field)-[:RELATES_TO {
  relationship_type: 'equivalent_concept',
  description: 'Time in business can be calculated from date established',
  bidirectional: true
}]->(full_field);

// ===========================================
// CONTACT INFO SHARED FIELDS
// ===========================================
// These fields are shared directly between Quick App and Full Apps
// Create explicit relationships for documentation

WITH [
  'first_name', 'last_name', 'business_email', 'business_phone', 'mobile_phone',
  'legal_business_name', 'website'
] AS sharedFields
MATCH (f:Field)
WHERE f.id IN sharedFields
SET f.shared_across_apps = true,
    f.quick_app_field = true,
    f.full_app_field = true;

// ===========================================
// QUICK APP ONLY FIELDS
// ===========================================
// Mark fields that are Quick App specific

WITH [
  'sms_consent', 'marketing_consent', 'quick_business_description',
  'w2_employee_count', 'contractor_count', 'fico_score_range',
  'use_of_funds', 'urgency', 'background_info', 'home_ownership_status',
  'desired_funding_amount', 'has_current_debt', 'total_debt_amount',
  'monthly_debt_payment', 'has_high_interest_debt', 'high_interest_debt_amount',
  'high_interest_monthly_payment', 'know_loan_type', 'annual_revenue',
  'net_income', 'bank_account_type', 'entity_type', 'entity_type_other',
  'industry', 'industry_other', 'time_in_business'
] AS quickAppOnlyFields
MATCH (f:Field)
WHERE f.id IN quickAppOnlyFields
SET f.quick_app_only = true;

// ===========================================
// DERIVATION HELPER: Create Derivation Node
// ===========================================
// Create a helper node that the Agentic layer can query
// to understand all available derivations

MERGE (d:DerivationConfig {id: 'field_derivations'})
SET d.description = 'Configuration for deriving Full App fields from Quick App data',
    d.updated_at = timestamp(),
    d.derivation_types = ['sum', 'range_midpoint', 'copy', 'calculate'],
    d.notes = 'The Agentic layer should check DERIVES_FROM relationships when populating Full App fields';

// ===========================================
// VERIFICATION QUERIES
// ===========================================

// List all derivation relationships
MATCH (target:Field)-[r:DERIVES_FROM]->(source:Field)
RETURN target.id as full_app_field, r.formula as formula, source.id as quick_app_field, r.description
ORDER BY target.id;

// Count derivations by type
MATCH (target:Field)-[r:DERIVES_FROM]->(source:Field)
RETURN r.formula as derivation_type, count(*) as count
ORDER BY count DESC;

// List shared fields
MATCH (f:Field)
WHERE f.shared_across_apps = true
RETURN f.id, f.label
ORDER BY f.id;

// List Quick App only fields
MATCH (f:Field)
WHERE f.quick_app_only = true
RETURN f.id, f.label
ORDER BY f.section, f.order;
