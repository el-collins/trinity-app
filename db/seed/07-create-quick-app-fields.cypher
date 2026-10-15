// ============================================================================
// TRINITY FINANCE - NEO4J ONTOLOGY SCHEMA
// Script 07: Create Quick Application Fields (30 fields)
// ============================================================================
// The Quick App is the initial form all applicants complete before selecting
// a specific loan type. It captures basic contact, business, and financial info.
// ============================================================================

// ===========================================
// SECTION: QUICK APP - CONTACT FIELDS
// ===========================================

MERGE (f:Field {id: 'legal_business_name'})
SET f.name = 'legalBusinessName', f.label = 'Legal Business Name', f.type = 'text', f.required = true,
    f.validation = ['required', 'min:2', 'max:100'], f.placeholder = 'Legal Business Name',
    f.ghl_field = 'companyName', f.section = 'quick_app_contact', f.order = 1;

MERGE (f:Field {id: 'sms_consent'})
SET f.name = 'smsConsent', f.label = 'I consent to receive SMS notifications, alerts & occasional marketing communication from Trinity Finance. Message frequency varies. Message & data rates may apply.',
    f.type = 'checkbox', f.required = true,
    f.validation = ['required', 'accepted'],
    f.ghl_field = 'smsConsent', f.section = 'quick_app_contact', f.order = 2;

MERGE (f:Field {id: 'marketing_consent'})
SET f.name = 'marketingConsent', f.label = 'I consent to receive marketing communications', f.type = 'checkbox', f.required = true,
    f.validation = ['required', 'accepted'],
    f.ghl_field = 'marketingConsent', f.section = 'quick_app_contact', f.order = 3;

// ===========================================
// SECTION: QUICK APP - BUSINESS FIELDS
// ===========================================

MERGE (f:Field {id: 'entity_type'})
SET f.name = 'entityType', f.label = 'Legal Business Entity Type', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['C Corporation', 'S Corporation', 'LLC', 'Sole Proprietorship', 'General Partnership (GP)', 'Limited Partnership (LP)', 'Non-Profit', 'State or Local Government', 'Other'],
    f.ghl_field = 'entityType', f.section = 'quick_app_business', f.order = 1;

MERGE (f:Field {id: 'entity_type_other'})
SET f.name = 'entityTypeOther', f.label = 'You Selected Other Entity Type - Please Specify', f.type = 'text', f.required = false,
    f.validation = ['required_if:entity_type,Other', 'max:100'],
    f.show_if = 'entity_type', f.show_if_value = 'Other',
    f.placeholder = 'Specify entity type',
    f.ghl_field = 'entityTypeOther', f.section = 'quick_app_business', f.order = 2;

MERGE (f:Field {id: 'industry'})
SET f.name = 'industry', f.label = 'Industry', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Agriculture', 'Automotive Repair', 'Automotive Sales & Gas Stations', 'Business Services', 'Communications', 'Construction & Contractors', 'Educational Services', 'Entertainment', 'Finance', 'Food and Beverage Stores', 'Freight', 'Health Services', 'Hotels and Lodging', 'Insurance', 'Legal Services', 'Manufacturing', 'Mining and Natural Resource Extraction', 'Miscellaneous Services', 'Personal Services', 'Real Estate', 'Religious Services', 'Restaurant / Bar', 'Retail', 'Storage', 'Transportation', 'Wholesale', 'Vehicle Rental', 'Other'],
    f.ghl_field = 'industry', f.section = 'quick_app_business', f.order = 3;

MERGE (f:Field {id: 'industry_other'})
SET f.name = 'industryOther', f.label = 'You Selected Other Industry - Please Specify', f.type = 'text', f.required = false,
    f.validation = ['required_if:industry,Other', 'max:100'],
    f.show_if = 'industry', f.show_if_value = 'Other',
    f.placeholder = 'Specify industry',
    f.ghl_field = 'industryOther', f.section = 'quick_app_business', f.order = 4;

MERGE (f:Field {id: 'quick_business_description'})
SET f.name = 'quickBusinessDescription', f.label = 'Explain the Nature of Your Business', f.type = 'textarea', f.required = true,
    f.validation = ['required', 'min:20', 'max:500'],
    f.placeholder = 'Describe what your business does',
    f.ghl_field = 'businessDescription', f.section = 'quick_app_business', f.order = 5;

MERGE (f:Field {id: 'time_in_business'})
SET f.name = 'timeInBusiness', f.label = 'Time in Business (How Long Has Your Business Been Incorporated?)', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['0-6 Months', '6-12 Months', '1-2 Years', '2-5 Years', '5-10 Years', '10+ Years'],
    f.ghl_field = 'timeInBusiness', f.section = 'quick_app_business', f.order = 6;

MERGE (f:Field {id: 'w2_employee_count'})
SET f.name = 'w2EmployeeCount', f.label = 'Number of W2 Employees', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.placeholder = '0',
    f.ghl_field = 'w2EmployeeCount', f.section = 'quick_app_business', f.order = 7;

MERGE (f:Field {id: 'contractor_count'})
SET f.name = 'contractorCount', f.label = 'Number of 1099 Employees (Including Contractors)', f.type = 'number', f.required = true,
    f.validation = ['required', 'integer', 'min:0'],
    f.placeholder = '0',
    f.ghl_field = 'contractorCount', f.section = 'quick_app_business', f.order = 8;

MERGE (f:Field {id: 'annual_revenue'})
SET f.name = 'annualRevenue', f.label = 'Annual Revenue', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Less than $125K', '125K-250K', '250K-500K', '500K-750K', '750K-1M', '1M-2M', '2M-2.5M', '2.5M-5M', '5M-7.5M', '7.5M-10M', 'More than 10M'],
    f.ghl_field = 'annualRevenue', f.section = 'quick_app_business', f.order = 9;

MERGE (f:Field {id: 'net_income'})
SET f.name = 'netIncome', f.label = 'Net Income / EBITDA', f.type = 'currency', f.required = true,
    f.validation = ['required'],
    f.placeholder = '$0',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'netIncome', f.section = 'quick_app_business', f.order = 10;

MERGE (f:Field {id: 'fico_score_range'})
SET f.name = 'ficoScoreRange', f.label = 'FICO Score', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['720+', '680-719', '640-679', '600-639', '599 or Less'],
    f.ghl_field = 'ficoScoreRange', f.section = 'quick_app_business', f.order = 11;

MERGE (f:Field {id: 'bank_account_type'})
SET f.name = 'bankAccountType', f.label = 'Bank Account Type', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Personal Account', 'Business Account'],
    f.ghl_field = 'bankAccountType', f.section = 'quick_app_business', f.order = 12;

// ===========================================
// SECTION: QUICK APP - FINANCIAL QUALIFICATION FIELDS
// ===========================================

MERGE (f:Field {id: 'use_of_funds'})
SET f.name = 'useOfFunds', f.label = 'Use of Funds', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Working Capital', 'Debt Refinance', 'Equipment Purchase', 'Materials', 'Real Estate Purchase', 'Business Acquisition', 'Other'],
    f.ghl_field = 'useOfFunds', f.section = 'quick_app_financial', f.order = 1;

MERGE (f:Field {id: 'urgency'})
SET f.name = 'urgency', f.label = 'Urgency', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['Like Yesterday', 'ASAP', 'This Week', 'Next Week', '2 Weeks', 'This Month', 'Next Month', 'Within 60 Days', 'Within 90 Days', 'Looking at Long-Term Options'],
    f.ghl_field = 'urgency', f.section = 'quick_app_financial', f.order = 2;

MERGE (f:Field {id: 'background_info'})
SET f.name = 'backgroundInfo', f.label = 'Background Info (Let us know about you and how a loan at this time could help)', f.type = 'textarea', f.required = false,
    f.validation = ['max:1000'],
    f.placeholder = 'Any additional information that would help us serve you better',
    f.ghl_field = 'backgroundInfo', f.section = 'quick_app_financial', f.order = 3;

MERGE (f:Field {id: 'home_ownership_status'})
SET f.name = 'homeOwnershipStatus', f.label = 'Home Ownership Status', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['I Own My Home Outright', 'I Have a Mortgage', 'I\'m Renting', 'Other'],
    f.ghl_field = 'homeOwnershipStatus', f.section = 'quick_app_financial', f.order = 4;

MERGE (f:Field {id: 'home_ownership_other'})
SET f.name = 'homeOwnershipOther', f.label = 'You Selected Other Home Ownership - Please Explain', f.type = 'text', f.required = false,
    f.validation = ['required_if:home_ownership_status,Other', 'max:200'],
    f.show_if = 'home_ownership_status', f.show_if_value = 'Other',
    f.ghl_field = 'homeOwnershipOther', f.section = 'quick_app_financial', f.order = 5;

MERGE (f:Field {id: 'desired_funding_amount'})
SET f.name = 'desiredFundingAmount', f.label = 'Desired Funding Amount', f.type = 'currency', f.required = true,
    f.validation = ['required', 'min:1000'],
    f.placeholder = '$0',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'desiredFundingAmount', f.section = 'quick_app_financial', f.order = 6;

MERGE (f:Field {id: 'has_current_debt'})
SET f.name = 'hasCurrentDebt', f.label = 'Does the Business Currently Have Debt?', f.type = 'radio', f.required = true,
    f.validation = ['required'],
    f.options = ['Yes', 'No'],
    f.ghl_field = 'hasCurrentDebt', f.section = 'quick_app_financial', f.order = 7;

MERGE (f:Field {id: 'total_debt_amount'})
SET f.name = 'totalDebtAmount', f.label = 'Total Debt Amount', f.type = 'currency', f.required = false,
    f.validation = ['required_if:has_current_debt,Yes', 'min:0'],
    f.show_if = 'has_current_debt', f.show_if_value = 'Yes',
    f.placeholder = '$0',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'totalDebtAmount', f.section = 'quick_app_financial', f.order = 8;

MERGE (f:Field {id: 'monthly_debt_payment'})
SET f.name = 'monthlyDebtPayment', f.label = 'What is Your Total Monthly Payment for Your Debt(s)?', f.type = 'currency', f.required = false,
    f.validation = ['required_if:has_current_debt,Yes', 'min:0'],
    f.show_if = 'has_current_debt', f.show_if_value = 'Yes',
    f.placeholder = '$0',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'monthlyDebtPayment', f.section = 'quick_app_financial', f.order = 9;

MERGE (f:Field {id: 'has_high_interest_debt'})
SET f.name = 'hasHighInterestDebt', f.label = 'Is Any of the Debt High Interest, Like MCAs?', f.type = 'radio', f.required = false,
    f.validation = ['required_if:has_current_debt,Yes'],
    f.show_if = 'has_current_debt', f.show_if_value = 'Yes',
    f.options = ['Yes', 'No'],
    f.ghl_field = 'hasHighInterestDebt', f.section = 'quick_app_financial', f.order = 10;

MERGE (f:Field {id: 'high_interest_debt_amount'})
SET f.name = 'highInterestDebtAmount', f.label = 'How Much of the Debt is MCA or Other High Interest Rate Debt?', f.type = 'currency', f.required = false,
    f.validation = ['required_if:has_high_interest_debt,Yes', 'min:0'],
    f.show_if = 'has_high_interest_debt', f.show_if_value = 'Yes',
    f.placeholder = '$0',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'highInterestDebtAmount', f.section = 'quick_app_financial', f.order = 11;

MERGE (f:Field {id: 'high_interest_monthly_payment'})
SET f.name = 'highInterestMonthlyPayment', f.label = 'What is Your Total Monthly Payment for Your High Interest Debt(s)?', f.type = 'currency', f.required = false,
    f.validation = ['required_if:has_high_interest_debt,Yes', 'min:0'],
    f.show_if = 'has_high_interest_debt', f.show_if_value = 'Yes',
    f.placeholder = '$0',
    f.help_text = 'Use full monetary numbers',
    f.ghl_field = 'highInterestMonthlyPayment', f.section = 'quick_app_financial', f.order = 12;

MERGE (f:Field {id: 'know_loan_type'})
SET f.name = 'knowLoanType', f.label = 'Do you know what type of loan you\'re looking for?', f.type = 'select', f.required = true,
    f.validation = ['required'],
    f.options = ['I have a specific loan in mind', 'I\'d like some help figuring out what\'s best for my situation'],
    f.ghl_field = 'knowLoanType', f.section = 'quick_app_financial', f.order = 13;

// Verify field count
MATCH (f:Field)
WHERE f.section STARTS WITH 'quick_app'
RETURN f.section, count(f) as field_count
ORDER BY f.section;
