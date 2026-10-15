// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 03: Create All Field Nodes (Comprehensive Field Ontology)
// ============================================================================
// This creates ALL possible form fields as nodes in the graph
// Each field has attributes the Agentic layer uses to render forms
// Fields are linked to loan types via relationships (Script 04)
// ============================================================================

// ===========================================
// SECTION: CONTACT INFORMATION FIELDS
// ===========================================

MERGE (f:Field {id: 'first_name'})
SET f.name = 'firstName', f.label = 'First Name', f.type = 'text', f.required = true,
    f.validation = ['required', 'min:2', 'max:50'], f.placeholder = 'First Name',
    f.ghl_field = 'firstName', f.section = 'contact_info', f.order = 1;

MERGE (f:Field {id: 'last_name'})
SET f.name = 'lastName', f.label = 'Last Name', f.type = 'text', f.required = true,
    f.validation = ['required', 'min:2', 'max:50'], f.placeholder = 'Last Name',
    f.ghl_field = 'lastName', f.section = 'contact_info', f.order = 2;

MERGE (f:Field {id: 'business_email'})
SET f.name = 'businessEmail', f.label = 'Business Email', f.type = 'email', f.required = true,
    f.validation = ['required', 'email'], f.placeholder = 'Email',
    f.ghl_field = 'email', f.section = 'contact_info', f.order = 3;

MERGE (f:Field {id: 'business_phone'})
SET f.name = 'businessPhone', f.label = 'Cell Phone', f.type = 'tel', f.required = true,
    f.validation = ['required', 'phone'], f.placeholder = 'Phone',
    f.ghl_field = 'phone', f.section = 'contact_info', f.order = 4;

MERGE (f:Field {id: 'mobile_phone'})
SET f.name = 'mobilePhone', f.label = 'Mobile (If Different From Above)', f.type = 'tel', f.required = false,
    f.validation = ['phone'], f.placeholder = '',
    f.ghl_field = 'mobilePhone', f.section = 'contact_info', f.order = 5;

MERGE (f:Field {id: 'website'})
SET f.name = 'website', f.label = 'Website', f.type = 'url', f.required = false,
    f.validation = ['url'], f.placeholder = 'Web URL goes here',
    f.ghl_field = 'website', f.section = 'contact_info', f.order = 6;

// ===========================================
// SECTION: BUSINESS INFORMATION FIELDS
// ===========================================

MERGE (f:Field {id: 'trade_name'})
SET f.name = 'tradeName', f.label = 'Trade Name (DBA)', f.type = 'text', f.required = false,
    f.validation = ['max:100'], f.placeholder = '',
    f.ghl_field = 'tradeName', f.section = 'business_info', f.order = 1;

MERGE (f:Field {id: 'state_incorporated'})
SET f.name = 'stateIncorporated', f.label = 'State Incorporated', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    f.ghl_field = 'stateIncorporated', f.section = 'business_info', f.order = 2;

MERGE (f:Field {id: 'date_established'})
SET f.name = 'dateEstablished', f.label = 'Date Business Established: (MM/DD/YYYY)', f.type = 'date', f.required = true,
    f.validation = ['required', 'date', 'before:today'], f.placeholder = 'MM/DD/YYYY',
    f.ghl_field = 'dateEstablished', f.section = 'business_info', f.order = 3;

MERGE (f:Field {id: 'physical_address'})
SET f.name = 'physicalAddress', f.label = 'Physical Business Address', f.type = 'address', f.required = true,
    f.validation = ['required'], f.placeholder = 'Address',
    f.ghl_field = 'address1', f.section = 'business_info', f.order = 4;

MERGE (f:Field {id: 'city'})
SET f.name = 'city', f.label = 'City', f.type = 'text', f.required = true,
    f.validation = ['required', 'max:100'], f.placeholder = 'City',
    f.ghl_field = 'city', f.section = 'business_info', f.order = 5;

MERGE (f:Field {id: 'state'})
SET f.name = 'state', f.label = 'State', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    f.ghl_field = 'state', f.section = 'business_info', f.order = 6;

MERGE (f:Field {id: 'postal_code'})
SET f.name = 'postalCode', f.label = 'Postal Code', f.type = 'text', f.required = true,
    f.validation = ['required', 'zipcode'], f.placeholder = 'Postal Code',
    f.ghl_field = 'postalCode', f.section = 'business_info', f.order = 7;

MERGE (f:Field {id: 'mailing_different'})
SET f.name = 'mailingDifferent', f.label = 'Is Your Mailing Address Different From Above?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'mailingDifferent', f.section = 'business_info', f.order = 8;

MERGE (f:Field {id: 'mailing_street'})
SET f.name = 'mailingStreet', f.label = 'Street Address For Mail', f.type = 'address', f.required = false,
    f.validation = ['required_if:mailingDifferent,Yes'],
    f.show_if = 'mailingDifferent', f.show_if_value = 'Yes',
    f.ghl_field = 'mailingStreet', f.section = 'business_info', f.order = 9;

MERGE (f:Field {id: 'mailing_city'})
SET f.name = 'mailingCity', f.label = 'City Mail', f.type = 'text', f.required = false,
    f.validation = ['required_if:mailingDifferent,Yes'],
    f.show_if = 'mailingDifferent', f.show_if_value = 'Yes',
    f.ghl_field = 'mailingCity', f.section = 'business_info', f.order = 10;

MERGE (f:Field {id: 'mailing_state'})
SET f.name = 'mailingState', f.label = 'State Mail', f.type = 'select', f.required = false,
    f.validation = ['required_if:mailingDifferent,Yes'],
    f.options = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    f.show_if = 'mailingDifferent', f.show_if_value = 'Yes',
    f.ghl_field = 'mailingState', f.section = 'business_info', f.order = 11;

MERGE (f:Field {id: 'mailing_postal'})
SET f.name = 'mailingPostal', f.label = 'Mailing Postal Code', f.type = 'text', f.required = false,
    f.validation = ['required_if:mailingDifferent,Yes', 'zipcode'],
    f.show_if = 'mailingDifferent', f.show_if_value = 'Yes',
    f.ghl_field = 'mailingPostal', f.section = 'business_info', f.order = 12;

// ===========================================
// SECTION: TAX & BUSINESS CONTROL FIELDS
// ===========================================

MERGE (f:Field {id: 'tax_id'})
SET f.name = 'taxId', f.label = 'Tax ID Number or Business Number (EIN)', f.type = 'text', f.required = true,
    f.validation = ['required', 'ein'], f.placeholder = 'XX-XXXXXXX',
    f.help_text = 'Federal Employer Identification Number',
    f.ghl_field = 'taxId', f.section = 'tax_control', f.order = 1;

MERGE (f:Field {id: 'num_employees'})
SET f.name = 'numEmployees', f.label = 'Number of Employees (Including 1099 Contractors)', f.type = 'number', f.required = false,
    f.validation = ['integer', 'min:0', 'max:100000'], f.placeholder = '',
    f.ghl_field = 'numEmployees', f.section = 'tax_control', f.order = 2,
    // Derivation: Can be computed from Quick App fields
    f.derived_from = ['w2_employee_count', 'contractor_count'],
    f.derivation_formula = 'sum',
    f.derivation_description = 'Sum of W2 employees and 1099 contractors from Quick App';

MERGE (f:Field {id: 'time_in_control'})
SET f.name = 'timeInControl', f.label = 'How Long Have You Been in Control of the Business? (Approx.)', f.type = 'text', f.required = true,
    f.validation = ['required'], f.placeholder = 'e.g., 5 years',
    f.ghl_field = 'timeInControl', f.section = 'tax_control', f.order = 3;

MERGE (f:Field {id: 'property_ownership'})
SET f.name = 'propertyOwnership', f.label = 'Business Property Ownership', f.type = 'radio', f.required = true,
    f.validation = ['required'],
    f.options = ['I Own the Real Estate Outright', 'I Have a Commercial Mortgage', 'I\'m Renting', 'I\'m on a Lease Agreement', 'Other'],
    f.ghl_field = 'propertyOwnership', f.section = 'tax_control', f.order = 4;

MERGE (f:Field {id: 'property_ownership_other'})
SET f.name = 'propertyOwnershipOther', f.label = 'You Selected Other Business Property Ownership - Please Explain', f.type = 'text', f.required = false,
    f.validation = ['required_if:propertyOwnership,Other', 'max:200'],
    f.show_if = 'propertyOwnership', f.show_if_value = 'Other',
    f.ghl_field = 'propertyOwnershipOther', f.section = 'tax_control', f.order = 5;

MERGE (f:Field {id: 'place_of_operation'})
SET f.name = 'placeOfOperation', f.label = 'Place of Operation', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Home Based', 'Office', 'Other'],
    f.ghl_field = 'placeOfOperation', f.section = 'tax_control', f.order = 6;

MERGE (f:Field {id: 'place_operation_other'})
SET f.name = 'placeOperationOther', f.label = 'You Selected Other For Place of Operation - Please Explain', f.type = 'text', f.required = false,
    f.validation = ['required_if:placeOfOperation,Other'],
    f.show_if = 'placeOfOperation', f.show_if_value = 'Other',
    f.ghl_field = 'placeOperationOther', f.section = 'tax_control', f.order = 7;

// ===========================================
// SECTION: LEGAL/COMPLIANCE FIELDS (Basic - for SBA, LOC, MCA, General)
// ===========================================

MERGE (f:Field {id: 'convicted_crime'})
SET f.name = 'convictedCrime', f.label = 'Have you ever been convicted of a crime?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'convictedCrime', f.section = 'legal', f.order = 1;

MERGE (f:Field {id: 'crime_explanation'})
SET f.name = 'crimeExplanation', f.label = 'You Selected Yes for the Previous Question - Please Explain', f.type = 'textarea', f.required = false,
    f.validation = ['required_if:convictedCrime,Yes', 'max:500'],
    f.show_if = 'convictedCrime', f.show_if_value = 'Yes',
    f.ghl_field = 'crimeExplanation', f.section = 'legal', f.order = 2;

MERGE (f:Field {id: 'filed_bankruptcy'})
SET f.name = 'filedBankruptcy', f.label = 'Has the business or any principal ever filed for Bankruptcy Protection?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'filedBankruptcy', f.section = 'legal', f.order = 3;

MERGE (f:Field {id: 'bankruptcy_when'})
SET f.name = 'bankruptcyWhen', f.label = 'How Long Ago Was the Bankruptcy Filed?', f.type = 'text', f.required = false,
    f.validation = ['required_if:filedBankruptcy,Yes'], f.placeholder = 'e.g., 3 years ago',
    f.show_if = 'filedBankruptcy', f.show_if_value = 'Yes',
    f.ghl_field = 'bankruptcyWhen', f.section = 'legal', f.order = 4;

MERGE (f:Field {id: 'pending_claims'})
SET f.name = 'pendingClaims', f.label = 'Are there any pending, threatened, or recently filed claims, judgments or tax liens against the business or any principals?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'pendingClaims', f.section = 'legal', f.order = 5;

// ===========================================
// SECTION: EXTENDED LEGAL FIELDS (for Invoice Factoring, Invoice Financing, LOC, MCA, SBA, General)
// ===========================================

MERGE (f:Field {id: 'ucc_filings'})
SET f.name = 'uccFilings', f.label = 'Are there any UCC Filings Against You?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'uccFilings', f.section = 'legal_extended', f.order = 1;

MERGE (f:Field {id: 'ucc_filings_with_whom'})
SET f.name = 'uccFilingsWithWhom', f.label = 'You Selected Yes For UCC Filings - With Whom?', f.type = 'text', f.required = false,
    f.validation = ['required_if:uccFilings,Yes'],
    f.show_if = 'uccFilings', f.show_if_value = 'Yes',
    f.ghl_field = 'uccFilingsWithWhom', f.section = 'legal_extended', f.order = 2;

MERGE (f:Field {id: 'taxes_past_due'})
SET f.name = 'taxesPastDue', f.label = 'Do you have any Federal or State Taxes Past Due?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'taxesPastDue', f.section = 'legal_extended', f.order = 3;

MERGE (f:Field {id: 'taxes_past_due_explain'})
SET f.name = 'taxesPastDueExplain', f.label = 'You Selected Yes For Past Due Taxes - Please Explain', f.type = 'textarea', f.required = false,
    f.validation = ['required_if:taxesPastDue,Yes'],
    f.show_if = 'taxesPastDue', f.show_if_value = 'Yes',
    f.ghl_field = 'taxesPastDueExplain', f.section = 'legal_extended', f.order = 4;

MERGE (f:Field {id: 'us_citizens_check'})
SET f.name = 'usCitizensCheck', f.label = 'Are all owners (including shareholders) and officers/directors U.S. Citizens, and have the legal right to be in the United States?', f.type = 'radio', f.required = false,
    f.options = ['Yes', 'No'],
    f.help_text = 'If Approved Preliminarily, Please Have Photocopies of your Passport; and also your Work VISA or Permanent Resident Card (Form I-551) ready for Lender Submission',
    f.ghl_field = 'usCitizensCheck', f.section = 'legal_extended', f.order = 5;

MERGE (f:Field {id: 'us_citizens_explain'})
SET f.name = 'usCitizensExplain', f.label = 'You Selected No for U.S. Citizens - Please Explain', f.type = 'textarea', f.required = false,
    f.validation = ['required_if:usCitizensCheck,No', 'max:500'],
    f.show_if = 'usCitizensCheck', f.show_if_value = 'No',
    f.ghl_field = 'usCitizensExplain', f.section = 'legal_extended', f.order = 6;

// ===========================================
// SECTION: OWNER/PRINCIPAL INFORMATION FIELDS
// ===========================================

MERGE (f:Field {id: 'owner_full_name'})
SET f.name = 'ownerFullName', f.label = 'Owner\'s Full Name', f.type = 'text', f.required = true,
    f.validation = ['required', 'min:2', 'max:100'],
    f.ghl_field = 'ownerFullName', f.section = 'owner_info', f.order = 1;

MERGE (f:Field {id: 'owner_phone'})
SET f.name = 'ownerPhone', f.label = 'Best Phone Number', f.type = 'tel', f.required = true,
    f.validation = ['required', 'phone'],
    f.ghl_field = 'ownerPhone', f.section = 'owner_info', f.order = 2;

MERGE (f:Field {id: 'owner_title'})
SET f.name = 'ownerTitle', f.label = 'Owner\'s Title', f.type = 'text', f.required = true,
    f.validation = ['required'], f.placeholder = 'e.g., CEO, Owner, President',
    f.ghl_field = 'ownerTitle', f.section = 'owner_info', f.order = 3;

MERGE (f:Field {id: 'owner_home_address'})
SET f.name = 'ownerHomeAddress', f.label = 'Home Address', f.type = 'address', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'ownerHomeAddress', f.section = 'owner_info', f.order = 4;

MERGE (f:Field {id: 'owner_dob'})
SET f.name = 'ownerDob', f.label = 'Date of Birth', f.type = 'date', f.required = true,
    f.validation = ['required', 'date', 'before:today', 'age:18'], f.placeholder = 'MM/DD/YYYY',
    f.ghl_field = 'ownerDob', f.section = 'owner_info', f.order = 5;

MERGE (f:Field {id: 'owner_email'})
SET f.name = 'ownerEmail', f.label = 'Best Email Address', f.type = 'email', f.required = true,
    f.validation = ['required', 'email'],
    f.ghl_field = 'ownerEmail', f.section = 'owner_info', f.order = 6;

MERGE (f:Field {id: 'owner_fico'})
SET f.name = 'ownerFico', f.label = 'Personal FICO Score', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:300', 'max:900'],
    f.help_text = 'Credit range (300-900 for Canadian applicants)',
    f.ghl_field = 'ownerFico', f.section = 'owner_info', f.order = 7,
    // Derivation: Can use Quick App FICO range midpoint as estimate
    f.derived_from = ['fico_score_range'],
    f.derivation_formula = 'range_midpoint',
    f.derivation_description = 'Midpoint of FICO range from Quick App (e.g., 700-749 → 725)';

MERGE (f:Field {id: 'owner_ssn'})
SET f.name = 'ownerSsn', f.label = 'Social Security Number', f.type = 'ssn', f.required = true,
    f.validation = ['required', 'ssn'], f.placeholder = 'XXX-XX-XXXX',
    f.encrypted = true,
    f.ghl_field = 'ownerSsn', f.section = 'owner_info', f.order = 8;

MERGE (f:Field {id: 'owner_dl_state'})
SET f.name = 'ownerDlState', f.label = 'Driver\'s License State', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    f.ghl_field = 'ownerDlState', f.section = 'owner_info', f.order = 9;

MERGE (f:Field {id: 'owner_dl_number'})
SET f.name = 'ownerDlNumber', f.label = 'Driver\'s License #', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.encrypted = true,
    f.ghl_field = 'ownerDlNumber', f.section = 'owner_info', f.order = 10;

// Owner at 20% threshold (SBA, LOC, MCA, General)
MERGE (f:Field {id: 'only_owner_20'})
SET f.name = 'onlyOwner20', f.label = 'Are you the ONLY Owner at or Above 20% Equity?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ownership_threshold = 20,
    f.ghl_field = 'onlyOwner', f.section = 'owner_info', f.order = 11;

// Owner at 10% threshold (Equipment, Invoice Factoring, Invoice Financing)
MERGE (f:Field {id: 'only_owner_10'})
SET f.name = 'onlyOwner10', f.label = 'Are You the Only Owner at or Above 10% Ownership?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ownership_threshold = 10,
    f.ghl_field = 'onlyOwner', f.section = 'owner_info', f.order = 11;

MERGE (f:Field {id: 'ownership_percent'})
SET f.name = 'ownershipPercent', f.label = 'Percent of Ownership', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:1', 'max:100'], f.placeholder = '%',
    f.ghl_field = 'ownershipPercent', f.section = 'owner_info', f.order = 12;

// Additional owners for 20% threshold
MERGE (f:Field {id: 'additional_owners_count_20'})
SET f.name = 'additionalOwnersCount20', f.label = 'How Many Additional Owners At Or Above 20%?', f.type = 'select', f.required = false,
    f.validation = ['required_if:onlyOwner20,No'],
    f.show_if = 'onlyOwner20', f.show_if_value = 'No',
    f.options = ['1', '2', '3', '4'],
    f.ownership_threshold = 20,
    f.ghl_field = 'additionalOwnersCount', f.section = 'owner_info', f.order = 13;

// Additional owners for 10% threshold
MERGE (f:Field {id: 'additional_owners_count_10'})
SET f.name = 'additionalOwnersCount10', f.label = 'How Many Additional Owners At Or Above 10%?', f.type = 'select', f.required = false,
    f.validation = ['required_if:onlyOwner10,No'],
    f.show_if = 'onlyOwner10', f.show_if_value = 'No',
    f.options = ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    f.ownership_threshold = 10,
    f.ghl_field = 'additionalOwnersCount', f.section = 'owner_info', f.order = 13;

// Invoice Financing specific owner field
MERGE (f:Field {id: 'equity_other_businesses'})
SET f.name = 'equityOtherBusinesses', f.label = 'Do you have equity in any other businesses?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'equityOtherBusinesses', f.section = 'owner_info', f.order = 14;

MERGE (f:Field {id: 'equity_other_businesses_explain'})
SET f.name = 'equityOtherBusinessesExplain', f.label = 'You Selected Yes You Have Equity in Other Businesses, Please Explain', f.type = 'textarea', f.required = false,
    f.validation = ['required_if:equityOtherBusinesses,Yes'],
    f.show_if = 'equityOtherBusinesses', f.show_if_value = 'Yes',
    f.ghl_field = 'equityOtherBusinessesExplain', f.section = 'owner_info', f.order = 15;

// ===========================================
// SECTION: FINANCIAL INFORMATION FIELDS
// ===========================================

MERGE (f:Field {id: 'avg_monthly_card_sales'})
SET f.name = 'avgMonthlyCardSales', f.label = 'Average Monthly Card Sales', f.type = 'currency', f.required = true,
    f.validation = ['required', 'currency', 'min:0'], f.placeholder = '$',
    f.help_text = 'Average monthly credit/debit card sales',
    f.ghl_field = 'avgMonthlyCardSales', f.section = 'financial', f.order = 1;

MERGE (f:Field {id: 'total_monthly_sales'})
SET f.name = 'totalMonthlySales', f.label = 'Total Monthly Sales', f.type = 'currency', f.required = true,
    f.validation = ['required', 'currency', 'min:0'], f.placeholder = '$',
    f.ghl_field = 'totalMonthlySales', f.section = 'financial', f.order = 2;

MERGE (f:Field {id: 'annual_gross_sales'})
SET f.name = 'annualGrossSales', f.label = 'Annual Gross Sales', f.type = 'currency', f.required = true,
    f.validation = ['required', 'currency', 'min:0'], f.placeholder = '$',
    f.ghl_field = 'annualGrossSales', f.section = 'financial', f.order = 3;

MERGE (f:Field {id: 'additional_notes'})
SET f.name = 'additionalNotes', f.label = 'Any Additional Notes For our Team to Consider?', f.type = 'textarea', f.required = false,
    f.validation = ['max:1000'], f.placeholder = 'Optional additional information...',
    f.ghl_field = 'additionalNotes', f.section = 'financial', f.order = 4;

// ===========================================
// SECTION: MCA-SPECIFIC FINANCIAL FIELDS
// ===========================================

MERGE (f:Field {id: 'average_monthly_gross_revenue'})
SET f.name = 'averageMonthlyGrossRevenue', f.label = 'Average Monthly Gross Revenue', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['$5,000 or Less', '$5,000-$10,000', '$10,000-$25,000', '$25,000-$50,000', '$50,000-$75,000', '$75,000-$100,000', '$100,000-$150,000', '$150,000-$200,000', '$200,000-$250,000', 'More than $250,000'],
    f.loan_specific = 'mca',
    f.ghl_field = 'averageMonthlyGrossRevenue', f.section = 'mca_financial', f.order = 1;

MERGE (f:Field {id: 'number_of_daily_transactions'})
SET f.name = 'numberOfDailyTransactions', f.label = 'Number of Daily Transactions', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Less Than 3', '3-5', '6-10', '11-15', '16-20', '21-30', '31-50', 'More than 50'],
    f.loan_specific = 'mca',
    f.ghl_field = 'numberOfDailyTransactions', f.section = 'mca_financial', f.order = 2;

MERGE (f:Field {id: 'current_credit_card_processor'})
SET f.name = 'currentCreditCardProcessor', f.label = 'Current Credit Card Processor', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Square', 'Toast', 'Clover', 'Other'],
    f.loan_specific = 'mca',
    f.ghl_field = 'currentCreditCardProcessor', f.section = 'mca_financial', f.order = 3;

MERGE (f:Field {id: 'credit_card_processor_other'})
SET f.name = 'creditCardProcessorOther', f.label = 'You Selected Other Processor - Please Specify', f.type = 'text', f.required = false,
    f.validation = ['required_if:currentCreditCardProcessor,Other', 'max:100'],
    f.show_if = 'currentCreditCardProcessor', f.show_if_value = 'Other',
    f.loan_specific = 'mca',
    f.ghl_field = 'creditCardProcessorOther', f.section = 'mca_financial', f.order = 4;

MERGE (f:Field {id: 'average_daily_card_sales'})
SET f.name = 'averageDailyCardSales', f.label = 'Average Daily Credit Card Sales', f.type = 'currency', f.required = true,
    f.validation = ['required', 'currency', 'min:0'], f.placeholder = '$',
    f.help_text = 'Use full monetary numbers',
    f.loan_specific = 'mca',
    f.ghl_field = 'averageDailyCardSales', f.section = 'mca_financial', f.order = 5;

// ===========================================
// SECTION: AUTHORIZATION FIELDS
// ===========================================

MERGE (f:Field {id: 'merchant_business_name'})
SET f.name = 'merchantBusinessName', f.label = 'Merchant / Business Name', f.type = 'text', f.required = true,
    f.validation = ['required', 'max:200'],
    f.ghl_field = 'merchantBusinessName', f.section = 'authorization', f.order = 1;

MERGE (f:Field {id: 'auth_owner_name'})
SET f.name = 'authOwnerName', f.label = 'Owner/Principal Full Name', f.type = 'text', f.required = true,
    f.validation = ['required', 'max:100'],
    f.ghl_field = 'authOwnerName', f.section = 'authorization', f.order = 2;

MERGE (f:Field {id: 'auth_owner_title'})
SET f.name = 'authOwnerTitle', f.label = 'Owner/Principal Title', f.type = 'text', f.required = true,
    f.validation = ['required', 'max:100'],
    f.ghl_field = 'authOwnerTitle', f.section = 'authorization', f.order = 3;

MERGE (f:Field {id: 'auth_signature'})
SET f.name = 'authSignature', f.label = 'Owner/Principal Signature', f.type = 'signature', f.required = true,
    f.validation = ['required'],
    f.help_text = 'Electronic signature',
    f.ghl_field = 'authSignature', f.section = 'authorization', f.order = 4;

MERGE (f:Field {id: 'auth_date'})
SET f.name = 'authDate', f.label = 'Today\'s Date', f.type = 'date', f.required = true,
    f.validation = ['required', 'date'],
    f.default_value = 'today', f.readonly = true,
    f.ghl_field = 'authDate', f.section = 'authorization', f.order = 5;

// ===========================================
// SECTION: LOAN-SPECIFIC FIELDS - SBA
// ===========================================

MERGE (f:Field {id: 'is_franchisee'})
SET f.name = 'isFranchisee', f.label = 'Are You a Franchisee?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.loan_specific = 'sba',
    f.ghl_field = 'isFranchisee', f.section = 'sba_specific', f.order = 1;

// ===========================================
// SECTION: LOAN-SPECIFIC FIELDS - LINE OF CREDIT
// ===========================================

MERGE (f:Field {id: 'intended_usage_frequency'})
SET f.name = 'intendedUsageFrequency', f.label = 'Intended Usage Frequency', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'As Needed'],
    f.loan_specific = 'line_of_credit',
    f.ghl_field = 'intendedUsageFrequency', f.section = 'loc_specific', f.order = 1;

// ===========================================
// SECTION: EQUIPMENT FINANCE SPECIFIC FIELDS
// ===========================================

MERGE (f:Field {id: 'equipment_type'})
SET f.name = 'equipmentType', f.label = 'Type of Equipment You\'d Like to Purchase / Sale-Leaseback', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Construction', 'Transportation', 'Manufacturing', 'Medical', 'Technology', 'Other'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentType', f.section = 'equipment_info', f.order = 1;

MERGE (f:Field {id: 'equipment_type_other'})
SET f.name = 'equipmentTypeOther', f.label = 'You Selected Other Equipment Type - Please Specify', f.type = 'text', f.required = false,
    f.validation = ['required_if:equipmentType,Other', 'max:200'],
    f.show_if = 'equipmentType', f.show_if_value = 'Other',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentTypeOther', f.section = 'equipment_info', f.order = 2;

MERGE (f:Field {id: 'equipment_description'})
SET f.name = 'equipmentDescription', f.label = 'Equipment Description', f.type = 'textarea', f.required = true,
    f.validation = ['required', 'min:10', 'max:500'],
    f.placeholder = 'Please describe the equipment (make, model, year, specifications)',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentDescription', f.section = 'equipment_info', f.order = 3;

MERGE (f:Field {id: 'equipment_value'})
SET f.name = 'equipmentValue', f.label = 'Equipment Value', f.type = 'currency', f.required = true,
    f.validation = ['required', 'currency', 'min:0'], f.placeholder = '$',
    f.help_text = 'Total value of the equipment you wish to finance',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentValue', f.section = 'equipment_info', f.order = 4;

MERGE (f:Field {id: 'equipment_condition'})
SET f.name = 'equipmentCondition', f.label = 'Condition of the Equipment', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['New', 'Certified Pre-Owned', 'Remanufactured', 'Reconditioned', 'Refurbished', 'Seller Refurbished', 'Used', 'Used - As Is'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentCondition', f.section = 'equipment_info', f.order = 5;

MERGE (f:Field {id: 'equipment_sourcing_method'})
SET f.name = 'equipmentSourcingMethod', f.label = 'How Are You Sourcing the Equipment?', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Dealer/Manufacturer', 'Private Seller', 'Currently Own - Want to Sale-Leaseback'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentSourcingMethod', f.section = 'equipment_info', f.order = 7;

MERGE (f:Field {id: 'equipment_delivery_date'})
SET f.name = 'equipmentDeliveryDate', f.label = 'What\'s The Delivery Date Assuming You Got Financing Today?', f.type = 'date', f.required = true,
    f.validation = ['required', 'date', 'after:today'],
    f.help_text = 'Expected delivery or availability date',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentDeliveryDate', f.section = 'equipment_info', f.order = 8;

MERGE (f:Field {id: 'equipment_location_same'})
SET f.name = 'equipmentLocationSame', f.label = 'Is Your Equipment Located at Your Physical Business Address?', f.type = 'radio', f.required = false,
    f.options = ['Yes', 'No, My Equipment Is Elsewhere'],
    f.help_text = 'This refers to the physical business address you provided in the Business Information section',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentLocationSame', f.section = 'equipment_info', f.order = 9;

MERGE (f:Field {id: 'equipment_location_type'})
SET f.name = 'equipmentLocationType', f.label = 'Which Address is Your Equipment Located At?', f.type = 'select', f.required = false,
    f.validation = ['required_if:equipmentLocationSame,No, My Equipment Is Elsewhere'],
    f.show_if = 'equipmentLocationSame', f.show_if_value = 'No, My Equipment Is Elsewhere',
    f.options = ['Physical Address', 'Mailing Address', 'Another Address'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentLocationType', f.section = 'equipment_info', f.order = 2;

MERGE (f:Field {id: 'equipment_street'})
SET f.name = 'equipmentStreet', f.label = 'Street Address For Equipment', f.type = 'address', f.required = false,
    f.validation = ['required_if:equipmentLocationType,Another Address'],
    f.show_if = 'equipmentLocationType', f.show_if_value = 'Another Address',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentStreet', f.section = 'equipment_info', f.order = 3;

MERGE (f:Field {id: 'equipment_city'})
SET f.name = 'equipmentCity', f.label = 'City Address For Equipment', f.type = 'text', f.required = false,
    f.validation = ['required_if:equipmentLocationType,Another Address'],
    f.show_if = 'equipmentLocationType', f.show_if_value = 'Another Address',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentCity', f.section = 'equipment_info', f.order = 4;

MERGE (f:Field {id: 'equipment_state'})
SET f.name = 'equipmentState', f.label = 'State For Equipment', f.type = 'select', f.required = false,
    f.validation = ['required_if:equipmentLocationType,Another Address'],
    f.show_if = 'equipmentLocationType', f.show_if_value = 'Another Address',
    f.options = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentState', f.section = 'equipment_info', f.order = 5;

MERGE (f:Field {id: 'equipment_postal'})
SET f.name = 'equipmentPostal', f.label = 'Postal Code For Equipment', f.type = 'text', f.required = false,
    f.validation = ['required_if:equipmentLocationType,Another Address', 'zipcode'],
    f.show_if = 'equipmentLocationType', f.show_if_value = 'Another Address',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentPostal', f.section = 'equipment_info', f.order = 6;

MERGE (f:Field {id: 'equipment_vendor'})
SET f.name = 'equipmentVendor', f.label = 'Equipment Vendor', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentVendor', f.section = 'equipment_info', f.order = 13;

MERGE (f:Field {id: 'equipment_supplier_name'})
SET f.name = 'equipmentSupplierName', f.label = 'Equipment Supplier Name', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentSupplierName', f.section = 'equipment_supplier', f.order = 1;

MERGE (f:Field {id: 'equipment_supplier_contact'})
SET f.name = 'equipmentSupplierContact', f.label = 'Supplier Contact Name', f.type = 'text', f.required = false,
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentSupplierContact', f.section = 'equipment_info', f.order = 16;

MERGE (f:Field {id: 'equipment_supplier_phone'})
SET f.name = 'equipmentSupplierPhone', f.label = 'Supplier Phone Number', f.type = 'tel', f.required = false,
    f.validation = ['phone'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentSupplierPhone', f.section = 'equipment_info', f.order = 17;

MERGE (f:Field {id: 'equipment_supplier_email'})
SET f.name = 'equipmentSupplierEmail', f.label = 'Supplier Email Address', f.type = 'email', f.required = false,
    f.validation = ['email'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentSupplierEmail', f.section = 'equipment_info', f.order = 18;

MERGE (f:Field {id: 'lease_term_months'})
SET f.name = 'leaseTermMonths', f.label = 'Lease Term (Months)', f.type = 'number', f.required = false,
    f.validation = ['integer', 'min:1', 'max:360'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'leaseTermMonths', f.section = 'equipment_info', f.order = 9;

MERGE (f:Field {id: 'lease_end_option'})
SET f.name = 'leaseEndOption', f.label = 'End of Lease Purchase Options', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Fair Market Value', '$1.00 Out', 'Percentage of Total Cash Price', 'Other'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'leaseEndOption', f.section = 'equipment_info', f.order = 10;

MERGE (f:Field {id: 'lease_end_option_other'})
SET f.name = 'leaseEndOptionOther', f.label = 'You Specified Other End of Lease Option - Please Specify', f.type = 'text', f.required = false,
    f.validation = ['required_if:leaseEndOption,Other'],
    f.show_if = 'leaseEndOption', f.show_if_value = 'Other',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'leaseEndOptionOther', f.section = 'equipment_info', f.order = 11;

MERGE (f:Field {id: 'equipment_quantity'})
SET f.name = 'equipmentQuantity', f.label = 'How Much Equipment Would You Like to Finance / Sale-Leaseback?', f.type = 'radio', f.required = true,
    f.validation = ['required'],
    f.options = ['Just One', 'More Than One'],
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentQuantity', f.section = 'equipment_info', f.order = 12;

MERGE (f:Field {id: 'equipment_quantity_count'})
SET f.name = 'equipmentQuantityCount', f.label = 'How many pieces of equipment?', f.type = 'number', f.required = false,
    f.validation = ['required_if:equipmentQuantity,More Than One', 'integer', 'min:2'],
    f.show_if = 'equipmentQuantity', f.show_if_value = 'More Than One',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentQuantityCount', f.section = 'equipment_info', f.order = 13;

// ===========================================
// SECTION: TRADE REFERENCES FIELDS
// ===========================================

MERGE (f:Field {id: 'trade_ref_1_company'})
SET f.name = 'tradeRef1Company', f.label = 'Company Name #1', f.type = 'text', f.required = false,
    f.help_text = 'Lenders Will Traditionally Only Reach Out to Trade References Once They have Underwritten the Deal and are Wanting to Proceed',
    f.ghl_field = 'tradeRef1Company', f.section = 'trade_references', f.order = 1;

MERGE (f:Field {id: 'trade_ref_1_phone'})
SET f.name = 'tradeRef1Phone', f.label = 'Company #1 Phone Number', f.type = 'tel', f.required = false,
    f.ghl_field = 'tradeRef1Phone', f.section = 'trade_references', f.order = 2;

MERGE (f:Field {id: 'trade_ref_1_address'})
SET f.name = 'tradeRef1Address', f.label = 'Full Company #1 Address', f.type = 'address', f.required = false,
    f.ghl_field = 'tradeRef1Address', f.section = 'trade_references', f.order = 3;

MERGE (f:Field {id: 'trade_ref_1_contact'})
SET f.name = 'tradeRef1Contact', f.label = 'Company #1 Contact Name', f.type = 'text', f.required = false,
    f.ghl_field = 'tradeRef1Contact', f.section = 'trade_references', f.order = 4;

MERGE (f:Field {id: 'trade_ref_1_email'})
SET f.name = 'tradeRef1Email', f.label = 'Company #1 Email Address', f.type = 'email', f.required = false,
    f.ghl_field = 'tradeRef1Email', f.section = 'trade_references', f.order = 5;

MERGE (f:Field {id: 'trade_ref_1_association'})
SET f.name = 'tradeRef1Association', f.label = 'What\'s your Association with Them?', f.type = 'text', f.required = false,
    f.ghl_field = 'tradeRef1Association', f.section = 'trade_references', f.order = 6;

MERGE (f:Field {id: 'trade_ref_1_duration'})
SET f.name = 'tradeRef1Duration', f.label = 'How Long Have You Been in Business with Them?', f.type = 'text', f.required = false,
    f.ghl_field = 'tradeRef1Duration', f.section = 'trade_references', f.order = 7;

MERGE (f:Field {id: 'trade_ref_2_company'})
SET f.name = 'tradeRef2Company', f.label = 'Company Name #2', f.type = 'text', f.required = false,
    f.ghl_field = 'tradeRef2Company', f.section = 'trade_references', f.order = 8;

MERGE (f:Field {id: 'trade_ref_2_contact'})
SET f.name = 'tradeRef2Contact', f.label = 'Company #2 Contact Name', f.type = 'text', f.required = false,
    f.ghl_field = 'tradeRef2Contact', f.section = 'trade_references', f.order = 9;

MERGE (f:Field {id: 'trade_ref_2_address'})
SET f.name = 'tradeRef2Address', f.label = 'Full Company #2 Address', f.type = 'address', f.required = false,
    f.ghl_field = 'tradeRef2Address', f.section = 'trade_references', f.order = 10;

MERGE (f:Field {id: 'trade_ref_2_phone'})
SET f.name = 'tradeRef2Phone', f.label = 'Company #2 Phone Number', f.type = 'tel', f.required = false,
    f.ghl_field = 'tradeRef2Phone', f.section = 'trade_references', f.order = 11;

MERGE (f:Field {id: 'trade_ref_2_email'})
SET f.name = 'tradeRef2Email', f.label = 'Company #2 Email Address', f.type = 'email', f.required = false,
    f.ghl_field = 'tradeRef2Email', f.section = 'trade_references', f.order = 12;

MERGE (f:Field {id: 'trade_ref_2_association'})
SET f.name = 'tradeRef2Association', f.label = 'What\'s Your Association With the Second Reference?', f.type = 'text', f.required = false,
    f.ghl_field = 'tradeRef2Association', f.section = 'trade_references', f.order = 13;

MERGE (f:Field {id: 'trade_ref_2_duration'})
SET f.name = 'tradeRef2Duration', f.label = 'How Long Have You Been In Business With The Second Reference?', f.type = 'text', f.required = false,
    f.ghl_field = 'tradeRef2Duration', f.section = 'trade_references', f.order = 14;

// ===========================================
// SECTION: BANK REFERENCES FIELDS
// ===========================================

MERGE (f:Field {id: 'bank_name'})
SET f.name = 'bankName', f.label = 'Bank Name', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.help_text = 'Lenders Will Traditionally Only Reach Out to Bank References Once They have Underwritten the Deal and are Wanting to Proceed',
    f.ghl_field = 'bankName', f.section = 'bank_references', f.order = 1;

MERGE (f:Field {id: 'bank_address'})
SET f.name = 'bankAddress', f.label = 'Full Bank Address', f.type = 'address', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'bankAddress', f.section = 'bank_references', f.order = 2;

MERGE (f:Field {id: 'bank_contact_person'})
SET f.name = 'bankContactPerson', f.label = 'Bank Contact Person', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'bankContactPerson', f.section = 'bank_references', f.order = 3;

MERGE (f:Field {id: 'bank_contact_phone'})
SET f.name = 'bankContactPhone', f.label = 'Bank Contact Person Phone Number', f.type = 'tel', f.required = true,
    f.validation = ['required', 'phone'],
    f.ghl_field = 'bankContactPhone', f.section = 'bank_references', f.order = 4;

MERGE (f:Field {id: 'bank_account_numbers'})
SET f.name = 'bankAccountNumbers', f.label = 'Account Number(s)', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.encrypted = true,
    f.ghl_field = 'bankAccountNumbers', f.section = 'bank_references', f.order = 5;

// ===========================================
// SECTION: ACCOUNTANT REFERENCES FIELDS
// ===========================================

MERGE (f:Field {id: 'accountant_name'})
SET f.name = 'accountantName', f.label = 'Accountant Name', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.help_text = 'Lenders Will Traditionally Only Reach Out to Accountant References Once They have Underwritten the Deal and are Wanting to Proceed. Write-in N/A if Not Applicable',
    f.ghl_field = 'accountantName', f.section = 'accountant_references', f.order = 1;

MERGE (f:Field {id: 'accountant_address'})
SET f.name = 'accountantAddress', f.label = 'Accountant Full Address', f.type = 'address', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'accountantAddress', f.section = 'accountant_references', f.order = 2;

MERGE (f:Field {id: 'accountant_email'})
SET f.name = 'accountantEmail', f.label = 'Accountant Email Address', f.type = 'email', f.required = true,
    f.validation = ['required', 'email'],
    f.ghl_field = 'accountantEmail', f.section = 'accountant_references', f.order = 3;

MERGE (f:Field {id: 'accountant_phone'})
SET f.name = 'accountantPhone', f.label = 'Accountant Telephone', f.type = 'tel', f.required = true,
    f.validation = ['required', 'phone'],
    f.ghl_field = 'accountantPhone', f.section = 'accountant_references', f.order = 4;

// ===========================================
// SECTION: EXTENDED BUSINESS FIELDS (Invoice Financing/Factoring)
// ===========================================

MERGE (f:Field {id: 'name_changed'})
SET f.name = 'nameChanged', f.label = 'Have you changed your name within the last two (2) years?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'nameChanged', f.section = 'extended_business', f.order = 1;

MERGE (f:Field {id: 'former_names'})
SET f.name = 'formerNames', f.label = 'You Selected Yes Your Name Has Changed. Please State Former Name(s).', f.type = 'text', f.required = false,
    f.validation = ['required_if:nameChanged,Yes'],
    f.show_if = 'nameChanged', f.show_if_value = 'Yes',
    f.ghl_field = 'formerNames', f.section = 'extended_business', f.order = 2;

MERGE (f:Field {id: 'business_description'})
SET f.name = 'businessDescription', f.label = 'Please Describe Business/Product(s)', f.type = 'textarea', f.required = true,
    f.validation = ['required', 'min:50'],
    f.ghl_field = 'businessDescription', f.section = 'extended_business', f.order = 3;

MERGE (f:Field {id: 'related_entity_1'})
SET f.name = 'relatedEntity1', f.label = 'Business 1', f.type = 'text', f.required = false,
    f.help_text = 'Please provide names of all entities either owned or operated by primarily same principals for last two (2) years (If Applicable)',
    f.ghl_field = 'relatedEntity1', f.section = 'extended_business', f.order = 4;

MERGE (f:Field {id: 'related_entity_2'})
SET f.name = 'relatedEntity2', f.label = 'Business 2', f.type = 'text', f.required = false,
    f.ghl_field = 'relatedEntity2', f.section = 'extended_business', f.order = 5;

MERGE (f:Field {id: 'related_entity_3'})
SET f.name = 'relatedEntity3', f.label = 'Business 3', f.type = 'text', f.required = false,
    f.ghl_field = 'relatedEntity3', f.section = 'extended_business', f.order = 6;

MERGE (f:Field {id: 'related_entity_4'})
SET f.name = 'relatedEntity4', f.label = 'Business 4', f.type = 'text', f.required = false,
    f.ghl_field = 'relatedEntity4', f.section = 'extended_business', f.order = 7;

MERGE (f:Field {id: 'merger_acquisition'})
SET f.name = 'mergerAcquisition', f.label = 'Has company been involved in a merger or acquisition within the last two (2) years?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.help_text = 'If Approved Preliminarily, please have a copy of purchase/sale agreement available for Lender Submission',
    f.ghl_field = 'mergerAcquisition', f.section = 'extended_business', f.order = 8;

// ===========================================
// SECTION: DAILY CONTACT FIELDS (Invoice Financing only)
// ===========================================

MERGE (f:Field {id: 'daily_contact_name'})
SET f.name = 'dailyContactName', f.label = 'Daily Contact Full Name', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'dailyContactName', f.section = 'daily_contact', f.order = 1;

MERGE (f:Field {id: 'daily_contact_title'})
SET f.name = 'dailyContactTitle', f.label = 'Daily Contact Title', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'dailyContactTitle', f.section = 'daily_contact', f.order = 2;

MERGE (f:Field {id: 'daily_contact_phone'})
SET f.name = 'dailyContactPhone', f.label = 'Daily Contact Phone Number', f.type = 'tel', f.required = true,
    f.validation = ['required', 'phone'],
    f.ghl_field = 'dailyContactPhone', f.section = 'daily_contact', f.order = 3;

MERGE (f:Field {id: 'daily_contact_mobile'})
SET f.name = 'dailyContactMobile', f.label = 'Daily Contact Mobile (If Different Than Above)', f.type = 'tel', f.required = false,
    f.ghl_field = 'dailyContactMobile', f.section = 'daily_contact', f.order = 4;

MERGE (f:Field {id: 'daily_contact_email'})
SET f.name = 'dailyContactEmail', f.label = 'Daily Contact Email', f.type = 'email', f.required = true,
    f.validation = ['required', 'email'],
    f.ghl_field = 'dailyContactEmail', f.section = 'daily_contact', f.order = 5;

// ===========================================
// SECTION: ACCOUNTS RECEIVABLE FIELDS (Invoice Financing only)
// ===========================================

MERGE (f:Field {id: 'total_customers'})
SET f.name = 'totalCustomers', f.label = 'Total Number of Customers', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:1'],
    f.help_text = 'Please Input Number Values',
    f.ghl_field = 'totalCustomers', f.section = 'accounts_receivable', f.order = 1;

MERGE (f:Field {id: 'domestic_customers'})
SET f.name = 'domesticCustomers', f.label = 'Number of Domestic Customers', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.help_text = 'Please Input Number Values',
    f.ghl_field = 'domesticCustomers', f.section = 'accounts_receivable', f.order = 2;

MERGE (f:Field {id: 'foreign_customers'})
SET f.name = 'foreignCustomers', f.label = 'Number of Foreign Customers', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.help_text = 'Please Input Number Values',
    f.ghl_field = 'foreignCustomers', f.section = 'accounts_receivable', f.order = 3;

MERGE (f:Field {id: 'open_invoices_amount'})
SET f.name = 'openInvoicesAmount', f.label = 'Open Invoices Dollar Amount', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'],
    f.help_text = 'Please Input Monetary Number Values', f.placeholder = '$',
    f.ghl_field = 'openInvoicesAmount', f.section = 'accounts_receivable', f.order = 4;

MERGE (f:Field {id: 'invoices_per_month'})
SET f.name = 'invoicesPerMonth', f.label = 'Number of Invoices Per Month', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:1'],
    f.help_text = 'Please Input Number Values',
    f.ghl_field = 'invoicesPerMonth', f.section = 'accounts_receivable', f.order = 5;

MERGE (f:Field {id: 'terms_discounts'})
SET f.name = 'termsDiscounts', f.label = 'Terms, discounts or incentives offered', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'termsDiscounts', f.section = 'accounts_receivable', f.order = 6;

MERGE (f:Field {id: 'anticipated_monthly_financing'})
SET f.name = 'anticipatedMonthlyFinancing', f.label = 'Anticipated Monthly Financing', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'],
    f.help_text = 'Please Input Monetary Number Value', f.placeholder = '$',
    f.ghl_field = 'anticipatedMonthlyFinancing', f.section = 'accounts_receivable', f.order = 7;

MERGE (f:Field {id: 'assets_pledged'})
SET f.name = 'assetsPledged', f.label = 'Are receivables, inventory or fixed assets pledged as collateral for current financing', f.type = 'radio', f.required = false,
    f.options = ['Yes', 'No'],
    f.ghl_field = 'assetsPledged', f.section = 'accounts_receivable', f.order = 8;

MERGE (f:Field {id: 'pledge_to_1'})
SET f.name = 'pledgeTo1', f.label = 'Pledge 1', f.type = 'text', f.required = false,
    f.validation = ['required_if:assetsPledged,Yes'],
    f.show_if = 'assetsPledged', f.show_if_value = 'Yes',
    f.help_text = 'You Selected Yes Receivables, Inventory, or assets are Pledged. To Whom?',
    f.ghl_field = 'pledgeTo1', f.section = 'accounts_receivable', f.order = 9;

MERGE (f:Field {id: 'pledge_to_2'})
SET f.name = 'pledgeTo2', f.label = 'Pledge 2', f.type = 'text', f.required = false,
    f.show_if = 'assetsPledged', f.show_if_value = 'Yes',
    f.ghl_field = 'pledgeTo2', f.section = 'accounts_receivable', f.order = 10;

MERGE (f:Field {id: 'pledge_to_3'})
SET f.name = 'pledgeTo3', f.label = 'Pledge 3', f.type = 'text', f.required = false,
    f.show_if = 'assetsPledged', f.show_if_value = 'Yes',
    f.ghl_field = 'pledgeTo3', f.section = 'accounts_receivable', f.order = 11;

MERGE (f:Field {id: 'pledge_to_4'})
SET f.name = 'pledgeTo4', f.label = 'Pledge 4', f.type = 'text', f.required = false,
    f.show_if = 'assetsPledged', f.show_if_value = 'Yes',
    f.ghl_field = 'pledgeTo4', f.section = 'accounts_receivable', f.order = 12;

MERGE (f:Field {id: 'pledge_to_5'})
SET f.name = 'pledgeTo5', f.label = 'Pledge 5', f.type = 'text', f.required = false,
    f.show_if = 'assetsPledged', f.show_if_value = 'Yes',
    f.ghl_field = 'pledgeTo5', f.section = 'accounts_receivable', f.order = 13;

MERGE (f:Field {id: 'bill_and_holds'})
SET f.name = 'billAndHolds', f.label = 'Are There Any Bill and Holds', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'billAndHolds', f.section = 'accounts_receivable', f.order = 14;

MERGE (f:Field {id: 'guaranteed_sales_offset'})
SET f.name = 'guaranteedSalesOffset', f.label = 'Are Any Guaranteed Sales or A/R Subject to Offset', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'guaranteedSalesOffset', f.section = 'accounts_receivable', f.order = 15;

MERGE (f:Field {id: 'accept_deposits'})
SET f.name = 'acceptDeposits', f.label = 'Do You Accept Deposits', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'acceptDeposits', f.section = 'accounts_receivable', f.order = 16;

// ===========================================
// SECTION: INVOICE FACTORING SPECIFIC FIELDS
// ===========================================

MERGE (f:Field {id: 'avg_invoice_value_factoring'})
SET f.name = 'avgInvoiceValueFactoring', f.label = 'Average Invoice Value', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Please Use Full Monetary Numbers',
    f.loan_specific = 'invoice_factoring',
    f.ghl_field = 'avgInvoiceValue', f.section = 'factoring_details', f.order = 1;

MERGE (f:Field {id: 'avg_invoice_terms_factoring'})
SET f.name = 'avgInvoiceTermsFactoring', f.label = 'Average Invoice Terms', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Less than Net 30', 'Net 30', 'Net 60', 'Net 90', 'Net 120', 'More than Net 120'],
    f.loan_specific = 'invoice_factoring',
    f.ghl_field = 'avgInvoiceTerms', f.section = 'factoring_details', f.order = 2;

MERGE (f:Field {id: 'typical_collection_period_factoring'})
SET f.name = 'typicalCollectionPeriodFactoring', f.label = 'Typical Payment Collection Period', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Less than Net 30', 'Net 30', 'Net 60', 'Net 90', 'Net 120', 'More than Net 120'],
    f.loan_specific = 'invoice_factoring',
    f.ghl_field = 'typicalCollectionPeriod', f.section = 'factoring_details', f.order = 3;

MERGE (f:Field {id: 'percent_invoices_to_factor'})
SET f.name = 'percentInvoicesToFactor', f.label = 'Percentage of Invoices to Factor', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:1', 'max:100'], f.placeholder = '%',
    f.loan_specific = 'invoice_factoring',
    f.ghl_field = 'percentInvoicesToFactor', f.section = 'factoring_details', f.order = 4;

MERGE (f:Field {id: 'total_ar_outstanding_factoring'})
SET f.name = 'totalArOutstandingFactoring', f.label = 'Total Current A/R Outstanding?', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Please Use Full Monetary Numbers',
    f.loan_specific = 'invoice_factoring',
    f.ghl_field = 'totalArOutstanding', f.section = 'factoring_details', f.order = 5;

MERGE (f:Field {id: 'avg_days_invoices_outstanding_factoring'})
SET f.name = 'avgDaysInvoicesOutstandingFactoring', f.label = 'Average Number of Days Invoices Outstanding', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.loan_specific = 'invoice_factoring',
    f.ghl_field = 'avgDaysInvoicesOutstanding', f.section = 'factoring_details', f.order = 6;

MERGE (f:Field {id: 'active_clients_outstanding_factoring'})
SET f.name = 'activeClientsOutstandingFactoring', f.label = 'Number of Active Clients Who Currently Have Outstanding Invoices', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.loan_specific = 'invoice_factoring',
    f.ghl_field = 'activeClientsOutstanding', f.section = 'factoring_details', f.order = 7;

// ===========================================
// SECTION: INVOICE FINANCING SPECIFIC QUICK APP FIELDS
// ===========================================

MERGE (f:Field {id: 'avg_invoice_value_financing'})
SET f.name = 'avgInvoiceValueFinancing', f.label = 'What\'s Your Average Invoice Value?', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.loan_specific = 'invoice_financing',
    f.ghl_field = 'avgInvoiceValue', f.section = 'financing_quick_details', f.order = 1;

MERGE (f:Field {id: 'avg_invoice_terms_financing'})
SET f.name = 'avgInvoiceTermsFinancing', f.label = 'Average Invoice Terms', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Less than Net 30', 'Net 30', 'Net 60', 'Net 90', 'Net 120', 'More than Net 120'],
    f.loan_specific = 'invoice_financing',
    f.ghl_field = 'avgInvoiceTerms', f.section = 'financing_quick_details', f.order = 2;

MERGE (f:Field {id: 'typical_collection_period_financing'})
SET f.name = 'typicalCollectionPeriodFinancing', f.label = 'Typical Payment Collection Period', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Less than Net 30', 'Net 30', 'Net 60', 'Net 90', 'Net 120', 'More than Net 120'],
    f.loan_specific = 'invoice_financing',
    f.ghl_field = 'typicalCollectionPeriod', f.section = 'financing_quick_details', f.order = 3;

MERGE (f:Field {id: 'total_ar_outstanding_financing'})
SET f.name = 'totalArOutstandingFinancing', f.label = 'Total A/R Outstanding', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Please Use Full Monetary Numbers',
    f.loan_specific = 'invoice_financing',
    f.ghl_field = 'totalArOutstanding', f.section = 'financing_quick_details', f.order = 4;

MERGE (f:Field {id: 'avg_days_invoices_outstanding_financing'})
SET f.name = 'avgDaysInvoicesOutstandingFinancing', f.label = 'Average # Days Invoices Outstanding', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.loan_specific = 'invoice_financing',
    f.ghl_field = 'avgDaysInvoicesOutstanding', f.section = 'financing_quick_details', f.order = 5;

MERGE (f:Field {id: 'active_clients_outstanding_financing'})
SET f.name = 'activeClientsOutstandingFinancing', f.label = 'What Number of Active Clients Have Outstanding Invoices', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.loan_specific = 'invoice_financing',
    f.ghl_field = 'activeClientsOutstanding', f.section = 'financing_quick_details', f.order = 6;

// ===========================================
// SECTION: WORKBOOK FIELDS (for in-application collection)
// ===========================================

MERGE (f:Field {id: 'debt_schedule_workbook'})
SET f.name = 'debtScheduleWorkbook',
    f.label = 'Debt Schedule Workbook',
    f.type = 'workbook',
    f.required = false,
    f.help_text = 'Complete the debt schedule workbook and paste the link or upload the file. This helps us understand your current debt obligations.',
    f.template_url = 'https://docs.google.com/spreadsheets/d/16PBMELjx0T6D_Il5-bZwUh1kVVkH18DzRTgXzxyiWTY/copy',
    f.ghl_field = 'debtScheduleWorkbook',
    f.section = 'workbooks',
    f.order = 1;

MERGE (f:Field {id: 'equipment_finance_workbook'})
SET f.name = 'equipmentFinanceWorkbook',
    f.label = 'Equipment Finance Workbook',
    f.type = 'workbook',
    f.required = false,
    f.help_text = 'Complete the equipment finance workbook and paste the link or upload the file. This provides details about the equipment you wish to finance.',
    f.template_url = 'https://docs.google.com/spreadsheets/d/1nF_E7Fw67oZEDjTngK7yU2G3FQoSE0-09G1r4vu7_Y4/copy',
    f.loan_specific = 'equipment_finance',
    f.ghl_field = 'equipmentFinanceWorkbook',
    f.section = 'workbooks',
    f.order = 2;

MERGE (f:Field {id: 'ar_aging_workbook'})
SET f.name = 'arAgingWorkbook',
    f.label = 'Accounts Receivable Aging Report',
    f.type = 'workbook',
    f.required = false,
    f.help_text = 'Complete the AR aging report workbook and paste the link or upload the file. This helps us understand your receivables.',
    f.template_url = 'https://docs.google.com/spreadsheets/d/1sU7B_5_0eDjUFxF4m91TqxXGM9VftZxGr5kk-xdHsGI/copy',
    f.ghl_field = 'arAgingWorkbook',
    f.section = 'workbooks',
    f.order = 3;

// ===========================================
// SECTION: FRANCHISEE CONDITIONAL FIELD
// ===========================================

MERGE (f:Field {id: 'franchisee_entity_name'})
SET f.name = 'franchiseeEntityName', f.label = 'What is the entity name you are franchised under?', f.type = 'text', f.required = false,
    f.validation = ['required_if:isFranchisee,Yes', 'max:200'],
    f.show_if = 'isFranchisee', f.show_if_value = 'Yes',
    f.ghl_field = 'franchiseeEntityName', f.section = 'sba_specific', f.order = 2;

// ===========================================
// SECTION: MCA SUB-QUESTIONS (conditional on high-interest debt)
// ===========================================
// These appear in LOC, MCA, SBA, and General/Unsure loan types
// when the applicant indicated high-interest debt in the Quick App

MERGE (f:Field {id: 'mca_count'})
SET f.name = 'mcaCount', f.label = 'How many current Merchant Cash Advances (MCAs) do you have?', f.type = 'select', f.required = false,
    f.validation = ['required'],
    f.options = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    f.ghl_field = 'mcaCount', f.section = 'mca_details', f.order = 1;

MERGE (f:Field {id: 'mca_lender_1'})
SET f.name = 'mcaLender1', f.label = 'MCA #1 - Lender Name', f.type = 'text', f.required = false,
    f.ghl_field = 'mcaLender1', f.section = 'mca_details', f.order = 2;

MERGE (f:Field {id: 'mca_amount_1'})
SET f.name = 'mcaAmount1', f.label = 'MCA #1 - Amount', f.type = 'currency', f.required = false,
    f.placeholder = '$', f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'mcaAmount1', f.section = 'mca_details', f.order = 3;

MERGE (f:Field {id: 'mca_lender_2'})
SET f.name = 'mcaLender2', f.label = 'MCA #2 - Lender Name', f.type = 'text', f.required = false,
    f.ghl_field = 'mcaLender2', f.section = 'mca_details', f.order = 4;

MERGE (f:Field {id: 'mca_amount_2'})
SET f.name = 'mcaAmount2', f.label = 'MCA #2 - Amount', f.type = 'currency', f.required = false,
    f.placeholder = '$',
    f.ghl_field = 'mcaAmount2', f.section = 'mca_details', f.order = 5;

MERGE (f:Field {id: 'mca_lender_3'})
SET f.name = 'mcaLender3', f.label = 'MCA #3 - Lender Name', f.type = 'text', f.required = false,
    f.ghl_field = 'mcaLender3', f.section = 'mca_details', f.order = 6;

MERGE (f:Field {id: 'mca_amount_3'})
SET f.name = 'mcaAmount3', f.label = 'MCA #3 - Amount', f.type = 'currency', f.required = false,
    f.placeholder = '$',
    f.ghl_field = 'mcaAmount3', f.section = 'mca_details', f.order = 7;

MERGE (f:Field {id: 'mca_lender_4'})
SET f.name = 'mcaLender4', f.label = 'MCA #4 - Lender Name', f.type = 'text', f.required = false,
    f.ghl_field = 'mcaLender4', f.section = 'mca_details', f.order = 8;

MERGE (f:Field {id: 'mca_amount_4'})
SET f.name = 'mcaAmount4', f.label = 'MCA #4 - Amount', f.type = 'currency', f.required = false,
    f.placeholder = '$',
    f.ghl_field = 'mcaAmount4', f.section = 'mca_details', f.order = 9;

MERGE (f:Field {id: 'mca_lender_5'})
SET f.name = 'mcaLender5', f.label = 'MCA #5 - Lender Name', f.type = 'text', f.required = false,
    f.ghl_field = 'mcaLender5', f.section = 'mca_details', f.order = 10;

MERGE (f:Field {id: 'mca_amount_5'})
SET f.name = 'mcaAmount5', f.label = 'MCA #5 - Amount', f.type = 'currency', f.required = false,
    f.placeholder = '$',
    f.ghl_field = 'mcaAmount5', f.section = 'mca_details', f.order = 11;

// ===========================================
// SECTION: INVOICE FINANCING - PERCENTAGE FIELD
// ===========================================

MERGE (f:Field {id: 'percent_invoices_to_finance'})
SET f.name = 'percentInvoicesToFinance', f.label = 'Percentage of Invoices to Factor', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.loan_specific = 'invoice_financing',
    f.ghl_field = 'percentInvoicesToFinance', f.section = 'financing_quick_details', f.order = 4;

// ===========================================
// SECTION: DEBT RELIEF SPECIFIC FIELDS (Section 9)
// ===========================================

// Debt Relief has its own contact info section
MERGE (f:Field {id: 'dr_business_phone'})
SET f.name = 'drBusinessPhone', f.label = 'Business Phone', f.type = 'tel', f.required = true,
    f.validation = ['required', 'phone'],
    f.ghl_field = 'drBusinessPhone', f.section = 'debt_relief_contact', f.order = 1;

MERGE (f:Field {id: 'dr_mobile_phone'})
SET f.name = 'drMobilePhone', f.label = 'Mobile (If Different From Above)', f.type = 'tel', f.required = false,
    f.validation = ['phone'],
    f.ghl_field = 'drMobilePhone', f.section = 'debt_relief_contact', f.order = 2;

MERGE (f:Field {id: 'dr_company_website'})
SET f.name = 'drCompanyWebsite', f.label = 'Company Website', f.type = 'url', f.required = false,
    f.validation = ['url'],
    f.ghl_field = 'drCompanyWebsite', f.section = 'debt_relief_contact', f.order = 3;

// Debt Relief Business Info
MERGE (f:Field {id: 'dr_relationship_to_business'})
SET f.name = 'drRelationshipToBusiness', f.label = 'Relationship to the Business', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'drRelationshipToBusiness', f.section = 'debt_relief_business', f.order = 1;

MERGE (f:Field {id: 'dr_is_operational'})
SET f.name = 'drIsOperational', f.label = 'Is the Business Operational?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'drIsOperational', f.section = 'debt_relief_business', f.order = 2;

MERGE (f:Field {id: 'dr_w2_employees'})
SET f.name = 'drW2Employees', f.label = 'How Many W2 Employees Does the Business Have?', f.type = 'text', f.required = true,
    f.validation = ['required'],
    f.ghl_field = 'drW2Employees', f.section = 'debt_relief_business', f.order = 3;

MERGE (f:Field {id: 'dr_debt_schedule_link'})
SET f.name = 'drDebtScheduleLink', f.label = 'Please Fill Out Our Debt Schedule Workbook and Add Link Below', f.type = 'url', f.required = false,
    f.help_text = 'Link to Debt Schedule Workbook (Google Sheets)',
    f.ghl_field = 'drDebtScheduleLink', f.section = 'debt_relief_business', f.order = 4;

// Debt Relief Location & Franchise
MERGE (f:Field {id: 'dr_number_of_locations'})
SET f.name = 'drNumberOfLocations', f.label = 'Number of Locations', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:1'],
    f.ghl_field = 'drNumberOfLocations', f.section = 'debt_relief_location', f.order = 1;

MERGE (f:Field {id: 'dr_is_franchisee'})
SET f.name = 'drIsFranchisee', f.label = 'Are You a Franchisee?', f.type = 'select', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'drIsFranchisee', f.section = 'debt_relief_location', f.order = 2;

MERGE (f:Field {id: 'dr_franchisee_entity'})
SET f.name = 'drFranchiseeEntity', f.label = 'What is the entity name you are franchised under?', f.type = 'text', f.required = false,
    f.validation = ['required_if:drIsFranchisee,Yes'],
    f.show_if = 'drIsFranchisee', f.show_if_value = 'Yes',
    f.ghl_field = 'drFranchiseeEntity', f.section = 'debt_relief_location', f.order = 3;

// Debt Relief Debt Info
MERGE (f:Field {id: 'dr_total_debt'})
SET f.name = 'drTotalDebt', f.label = 'Total Debt Amount', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'drTotalDebt', f.section = 'debt_relief_debt', f.order = 1;

MERGE (f:Field {id: 'dr_monthly_payment'})
SET f.name = 'drMonthlyPayment', f.label = 'What is Your Total Monthly Payment for Your Debt(s)?', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'drMonthlyPayment', f.section = 'debt_relief_debt', f.order = 2;

MERGE (f:Field {id: 'dr_has_high_interest'})
SET f.name = 'drHasHighInterest', f.label = 'Is Any of the Debt High Interest, Like Merchant Cash Advances (MCAs)?', f.type = 'radio', f.required = true,
    f.validation = ['required'], f.options = ['Yes', 'No'],
    f.ghl_field = 'drHasHighInterest', f.section = 'debt_relief_debt', f.order = 3;

MERGE (f:Field {id: 'dr_high_interest_amount'})
SET f.name = 'drHighInterestAmount', f.label = 'How Much of the Debt is MCA or Other High Interest Rate Debt?', f.type = 'currency', f.required = false,
    f.validation = ['required_if:drHasHighInterest,Yes', 'min:0'], f.placeholder = '$',
    f.show_if = 'drHasHighInterest', f.show_if_value = 'Yes',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'drHighInterestAmount', f.section = 'debt_relief_debt', f.order = 4;

MERGE (f:Field {id: 'dr_high_interest_monthly'})
SET f.name = 'drHighInterestMonthly', f.label = 'What is Your Total Monthly Payment for Your High Interest Debt(s)?', f.type = 'currency', f.required = false,
    f.validation = ['required_if:drHasHighInterest,Yes', 'min:0'], f.placeholder = '$',
    f.show_if = 'drHasHighInterest', f.show_if_value = 'Yes',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'drHighInterestMonthly', f.section = 'debt_relief_debt', f.order = 5;

// Debt Relief Accountant/Bookkeeper References
MERGE (f:Field {id: 'dr_accountant_business_name'})
SET f.name = 'drAccountantBusinessName', f.label = 'Accountant Business Name', f.type = 'text', f.required = false,
    f.help_text = 'Our Debt Relief partners will traditionally only reach out to accountant references once they have analyzed your situation and are wanting to proceed',
    f.ghl_field = 'drAccountantBusinessName', f.section = 'debt_relief_accountant', f.order = 1;

MERGE (f:Field {id: 'dr_accountant_name'})
SET f.name = 'drAccountantName', f.label = 'Accountant Name', f.type = 'text', f.required = false,
    f.ghl_field = 'drAccountantName', f.section = 'debt_relief_accountant', f.order = 2;

MERGE (f:Field {id: 'dr_accountant_address'})
SET f.name = 'drAccountantAddress', f.label = 'Accountant Full Address', f.type = 'address', f.required = false,
    f.ghl_field = 'drAccountantAddress', f.section = 'debt_relief_accountant', f.order = 3;

MERGE (f:Field {id: 'dr_accountant_email'})
SET f.name = 'drAccountantEmail', f.label = 'Accountant Email Address', f.type = 'email', f.required = false,
    f.validation = ['email'],
    f.ghl_field = 'drAccountantEmail', f.section = 'debt_relief_accountant', f.order = 4;

MERGE (f:Field {id: 'dr_accountant_phone'})
SET f.name = 'drAccountantPhone', f.label = 'Accountant Telephone', f.type = 'tel', f.required = false,
    f.validation = ['phone'],
    f.ghl_field = 'drAccountantPhone', f.section = 'debt_relief_accountant', f.order = 5;

// Debt Relief Revenue Info
MERGE (f:Field {id: 'dr_revenue_this_year'})
SET f.name = 'drRevenueThisYear', f.label = 'This Year\'s Gross Revenue', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'drRevenueThisYear', f.section = 'debt_relief_revenue', f.order = 1;

MERGE (f:Field {id: 'dr_revenue_last_year'})
SET f.name = 'drRevenueLastYear', f.label = 'Last Year\'s Gross Revenue', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'drRevenueLastYear', f.section = 'debt_relief_revenue', f.order = 2;

MERGE (f:Field {id: 'dr_revenue_two_years_ago'})
SET f.name = 'drRevenueTwoYearsAgo', f.label = 'Gross Revenue from Two (2) Years Ago', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:0'], f.placeholder = '$',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'drRevenueTwoYearsAgo', f.section = 'debt_relief_revenue', f.order = 3;

// Verify total field count
MATCH (f:Field)
RETURN count(f) as total_fields;
