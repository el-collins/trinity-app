// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 06: Verification & Query Examples
// ============================================================================
// Run these queries to verify the ontology is set up correctly
// These also serve as examples for how the Agentic layer queries the graph
// ============================================================================

// ===========================================
// VERIFICATION QUERIES
// ===========================================

// 1. Count all nodes by type
MATCH (n)
RETURN labels(n)[0] as node_type, count(n) as count
ORDER BY count DESC;

// 2. Count all relationships by type
MATCH ()-[r]->()
RETURN type(r) as relationship_type, count(r) as count
ORDER BY count DESC;

// 3. Count fields per loan type (EXPECTED RESULTS)
// SBA: ~45 fields
// Line of Credit: ~43 fields
// MCA: ~42 fields
// General: ~42 fields
// Equipment Finance: ~65 fields
// Invoice Factoring: ~75 fields
// Invoice Financing: ~95 fields
MATCH (lt:LoanType)-[:REQUIRES_FIELD]->(f:Field)
RETURN lt.id, lt.name, count(f) as field_count
ORDER BY field_count DESC;

// 4. Verify loan type properties
MATCH (lt:LoanType)
RETURN lt.id, lt.name, lt.ownership_threshold,
       lt.requires_trade_refs, lt.requires_bank_refs, lt.requires_accountant_refs
ORDER BY lt.name;

// 5. List all fields grouped by section
MATCH (f:Field)
RETURN f.section, count(f) as field_count, collect(f.id) as field_ids
ORDER BY f.section;

// 6. Count conditional relationships
MATCH (trigger:Field)-[r:CONDITIONALLY_SHOWS]->(dependent:Field)
RETURN count(r) as total_conditionals;

// ===========================================
// AGENTIC LAYER QUERY EXAMPLES
// ===========================================

// EXAMPLE 1: Get all fields for SBA loan in order
// This is what the Agentic layer queries when building the form
MATCH (lt:LoanType {id: 'sba'})-[:REQUIRES_FIELD]->(f:Field)
RETURN f.id, f.label, f.type, f.section, f.order, f.required, f.validation, f.options
ORDER BY f.section, f.order;

// EXAMPLE 2: Get fields grouped by section for Equipment Finance
MATCH (lt:LoanType {id: 'equipment_finance'})-[:REQUIRES_FIELD]->(f:Field)
RETURN f.section, collect({
  id: f.id,
  label: f.label,
  type: f.type,
  required: f.required,
  order: f.order
}) as fields
ORDER BY f.section;

// EXAMPLE 3: Get conditional fields for a specific trigger
// Use this to know what fields to show/hide when a field value changes
MATCH (trigger:Field {id: 'mailing_different'})-[r:CONDITIONALLY_SHOWS]->(dependent:Field)
RETURN trigger.id, r.when, dependent.id, dependent.label;

// EXAMPLE 4: Get all conditional relationships for Invoice Financing
MATCH (lt:LoanType {id: 'invoice_financing'})-[:REQUIRES_FIELD]->(trigger:Field)
MATCH (trigger)-[r:CONDITIONALLY_SHOWS]->(dependent:Field)
WHERE (lt)-[:REQUIRES_FIELD]->(dependent)
RETURN trigger.id as trigger_field, r.when as show_when, dependent.id as dependent_field
ORDER BY trigger.section, trigger.order;

// EXAMPLE 5: Check if a specific field is required for a loan type
MATCH (lt:LoanType {id: 'invoice_factoring'})-[:REQUIRES_FIELD]->(f:Field {id: 'accountant_name'})
RETURN f.id, f.label, f.required;

// EXAMPLE 6: Get ownership threshold field for a loan type
// This dynamically selects the correct ownership question based on loan type
MATCH (lt:LoanType {id: 'equipment_finance'})-[:REQUIRES_FIELD]->(f:Field)
WHERE f.id STARTS WITH 'only_owner_'
RETURN f.id, f.label, f.ownership_threshold;

// EXAMPLE 7: Get all fields that are encrypted (PII)
MATCH (f:Field)
WHERE f.encrypted = true
RETURN f.id, f.label, f.section;

// EXAMPLE 8: Get differences between two loan types
// Useful for showing user what additional info they need for a different loan
MATCH (lt1:LoanType {id: 'sba'})-[:REQUIRES_FIELD]->(f1:Field)
WITH collect(f1.id) as sba_fields
MATCH (lt2:LoanType {id: 'equipment_finance'})-[:REQUIRES_FIELD]->(f2:Field)
WHERE NOT f2.id IN sba_fields
RETURN f2.id, f2.label, f2.section as additional_equipment_fields
ORDER BY f2.section, f2.order;

// EXAMPLE 9: Get all unique sections used by a loan type
MATCH (lt:LoanType {id: 'invoice_financing'})-[:REQUIRES_FIELD]->(f:Field)
RETURN DISTINCT f.section as sections
ORDER BY sections;

// EXAMPLE 10: Full form structure for a loan type (ready for frontend rendering)
MATCH (lt:LoanType {id: 'sba'})-[:REQUIRES_FIELD]->(f:Field)
OPTIONAL MATCH (f)-[r:CONDITIONALLY_SHOWS]->(dependent:Field)
WHERE (lt)-[:REQUIRES_FIELD]->(dependent)
WITH f, collect({
  shows: dependent.id,
  when: r.when
}) as conditionals
RETURN f.section, f.order, f.id, f.name, f.label, f.type, f.required,
       f.validation, f.options, f.placeholder, f.help_text, f.show_if, f.show_if_value,
       conditionals
ORDER BY f.section, f.order;

// ===========================================
// DATA INTEGRITY CHECKS
// ===========================================

// Check for orphan fields (fields not linked to any loan type)
MATCH (f:Field)
WHERE NOT (f)<-[:REQUIRES_FIELD]-(:LoanType)
RETURN f.id, f.label as orphan_fields;

// Check for duplicate field IDs
MATCH (f:Field)
WITH f.id as field_id, count(f) as cnt
WHERE cnt > 1
RETURN field_id, cnt as duplicate_count;

// Check for missing required properties
MATCH (f:Field)
WHERE f.label IS NULL OR f.type IS NULL
RETURN f.id as fields_missing_properties;

// ===========================================
// SUMMARY REPORT
// ===========================================

// Generate a summary report of the ontology
MATCH (lt:LoanType)
OPTIONAL MATCH (lt)-[:REQUIRES_FIELD]->(f:Field)
WITH lt, count(f) as field_count
MATCH (allFields:Field)
WITH lt, field_count, count(DISTINCT allFields) as total_fields
RETURN
  'ONTOLOGY SUMMARY' as report,
  lt.name as loan_type,
  field_count as fields_required,
  total_fields as total_fields_in_system,
  round(toFloat(field_count) / toFloat(total_fields) * 100, 1) + '%' as coverage
ORDER BY field_count DESC;
