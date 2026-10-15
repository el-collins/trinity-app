// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 05: Create Conditional Field Relationships
// ============================================================================
// This creates CONDITIONALLY_SHOWS relationships between fields
// These relationships define when a field should be shown based on another field's value
// The Agentic layer uses these to dynamically show/hide fields
// ============================================================================

// ===========================================
// BUSINESS INFO CONDITIONALS
// ===========================================

// Mailing address fields show when mailingDifferent = Yes
MATCH (trigger:Field {id: 'mailing_different'})
MATCH (dependent:Field)
WHERE dependent.id IN ['mailing_street', 'mailing_city', 'mailing_state', 'mailing_postal']
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// ===========================================
// TAX & CONTROL CONDITIONALS
// ===========================================

// Place of operation "Other" explanation
MATCH (trigger:Field {id: 'place_of_operation'})
MATCH (dependent:Field {id: 'place_operation_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// ===========================================
// LEGAL CONDITIONALS
// ===========================================

// Crime explanation
MATCH (trigger:Field {id: 'convicted_crime'})
MATCH (dependent:Field {id: 'crime_explanation'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// Bankruptcy timing
MATCH (trigger:Field {id: 'filed_bankruptcy'})
MATCH (dependent:Field {id: 'bankruptcy_when'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// ===========================================
// EXTENDED LEGAL CONDITIONALS
// ===========================================

// UCC filings explanation
MATCH (trigger:Field {id: 'ucc_filings'})
MATCH (dependent:Field {id: 'ucc_filings_with_whom'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// Taxes past due explanation
MATCH (trigger:Field {id: 'taxes_past_due'})
MATCH (dependent:Field {id: 'taxes_past_due_explain'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// US citizens "No" explanation
MATCH (trigger:Field {id: 'us_citizens_check'})
MATCH (dependent:Field {id: 'us_citizens_explain'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'No', operator: 'equals'}]->(dependent);

// ===========================================
// BUSINESS PROPERTY & FRANCHISE CONDITIONALS
// ===========================================

// Property ownership "Other" explanation
MATCH (trigger:Field {id: 'property_ownership'})
MATCH (dependent:Field {id: 'property_ownership_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// Franchisee entity name (when is_franchisee = Yes)
MATCH (trigger:Field {id: 'is_franchisee'})
MATCH (dependent:Field {id: 'franchisee_entity_name'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// ===========================================
// MCA CONDITIONALS
// ===========================================

// Credit card processor "Other" explanation
MATCH (trigger:Field {id: 'current_credit_card_processor'})
MATCH (dependent:Field {id: 'credit_card_processor_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// ===========================================
// OWNER INFO CONDITIONALS
// ===========================================

// Additional owners (20% threshold) - for SBA, LOC, MCA
MATCH (trigger:Field {id: 'only_owner_20'})
MATCH (dependent:Field {id: 'additional_owners_count_20'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'No', operator: 'equals'}]->(dependent);

// Additional owners (10% threshold) - for Equipment, Invoice Factoring, Invoice Financing, General
MATCH (trigger:Field {id: 'only_owner_10'})
MATCH (dependent:Field {id: 'additional_owners_count_10'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'No', operator: 'equals'}]->(dependent);

// Equity in other businesses explanation
MATCH (trigger:Field {id: 'equity_other_businesses'})
MATCH (dependent:Field {id: 'equity_other_businesses_explain'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// ===========================================
// EXTENDED BUSINESS CONDITIONALS
// ===========================================

// Former names explanation
MATCH (trigger:Field {id: 'name_changed'})
MATCH (dependent:Field {id: 'former_names'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// ===========================================
// EQUIPMENT CONDITIONALS
// ===========================================

// Equipment type "Other" explanation
MATCH (trigger:Field {id: 'equipment_type'})
MATCH (dependent:Field {id: 'equipment_type_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// Equipment quantity count (when more than one)
MATCH (trigger:Field {id: 'equipment_quantity'})
MATCH (dependent:Field {id: 'equipment_quantity_count'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'More Than One', operator: 'equals'}]->(dependent);

// Equipment location type selection
MATCH (trigger:Field {id: 'equipment_location_same'})
MATCH (dependent:Field {id: 'equipment_location_type'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'No, My Equipment Is Elsewhere', operator: 'equals'}]->(dependent);

// Equipment address fields (when Another Address is selected)
MATCH (trigger:Field {id: 'equipment_location_type'})
MATCH (dependent:Field)
WHERE dependent.id IN ['equipment_street', 'equipment_city', 'equipment_state', 'equipment_postal']
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Another Address', operator: 'equals'}]->(dependent);

// Lease end option other explanation
MATCH (trigger:Field {id: 'lease_end_option'})
MATCH (dependent:Field {id: 'lease_end_option_other'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Other', operator: 'equals'}]->(dependent);

// ===========================================
// ACCOUNTS RECEIVABLE CONDITIONALS
// ===========================================

// Pledge fields show when assets are pledged
MATCH (trigger:Field {id: 'assets_pledged'})
MATCH (dependent:Field)
WHERE dependent.id IN ['pledge_to_1', 'pledge_to_2', 'pledge_to_3', 'pledge_to_4', 'pledge_to_5']
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// ===========================================
// DEBT RELIEF CONDITIONALS
// ===========================================

// Debt Relief franchisee entity name (when dr_is_franchisee = Yes)
MATCH (trigger:Field {id: 'dr_is_franchisee'})
MATCH (dependent:Field {id: 'dr_franchisee_entity'})
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// Debt Relief high interest debt details (when dr_has_high_interest = Yes)
MATCH (trigger:Field {id: 'dr_has_high_interest'})
MATCH (dependent:Field)
WHERE dependent.id IN ['dr_high_interest_amount', 'dr_high_interest_monthly']
MERGE (trigger)-[:CONDITIONALLY_SHOWS {when: 'Yes', operator: 'equals'}]->(dependent);

// ===========================================
// VERIFICATION
// ===========================================

// Count conditional relationships
MATCH ()-[r:CONDITIONALLY_SHOWS]->()
RETURN count(r) as total_conditional_relationships;

// List all conditional relationships
MATCH (trigger:Field)-[r:CONDITIONALLY_SHOWS]->(dependent:Field)
RETURN trigger.label as trigger_field, r.when as condition, dependent.label as shows_field
ORDER BY trigger.section, trigger.order;
