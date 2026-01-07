# Outcome-Based Underwriting Architecture

## Overview

TriIQ Smart Form implements an **outcome-based, not rule-based** approach to small-business lending intake. Instead of following fixed form sequences, the system dynamically selects questions and requests documents based on **what information is needed to reach underwriting decisions**.

## Core Philosophy

### Traditional Approach (What We DON'T Do)
- Fixed question sequence
- Measures "% form complete"
- Same questions for all loan types
- Documents requested at end
- Binary pass/fail decisions

### Outcome-Based Approach (What We DO)
- Dynamic question selection based on information value
- Measures underwriting readiness across 6 dimensions
- Product-aware flows adapted to loan type
- Documents requested when most valuable
- Confidence-scored decisions with escalation paths

## Six Underwriting Outcome Dimensions

Every application is continuously scored across six dimensions:

### 1. Identity Confidence (0-100)
**Question:** How confident are we in the identity of the business and owners?

**Factors:**
- EIN verification
- Business formation documents
- Owner identity documents (DL, Passport)
- Cross-reference checks
- Identity verification services

**Threshold:** 70
**Weight:** 20%

### 2. Operational Stability (0-100)
**Question:** How stable and established is the business?

**Factors:**
- Years in business
- Revenue consistency across periods
- Industry stability metrics
- Ownership stability
- Operating history

**Threshold:** 60
**Weight:** 15%

### 3. Cashflow Strength (0-100)
**Question:** How strong is the business's cashflow?

**Factors:**
- Cashflow from operations
- Average bank balance
- Revenue trends
- Revenue-to-loan ratio
- Seasonality patterns

**Threshold:** 65
**Weight:** 25% (highest)

### 4. Debt Burden (0-100)
**Question:** How manageable is existing debt?

**Factors:**
- Debt Service Coverage Ratio (DSCR)
- Total debt to revenue
- Number and type of existing debts
- High-risk debt (MCA) presence
- Payment history

**Threshold:** 60
**Weight:** 20%

### 5. Fraud Risk (0-100)
**Question:** Are there indicators of fraud or data inconsistency?

**Factors:**
- Data conflicts between sources
- Unverified documents
- Low-confidence extractions
- Owner identity concerns
- Unusual patterns

**Threshold:** 70 (higher is safer)
**Weight:** 10%

**Note:** This is an inverse score - higher = lower risk

### 6. Documentation Readiness (0-100)
**Question:** Do we have all required documents for this product type?

**Factors:**
- Percentage of required documents provided
- Document verification status
- Extraction completeness
- Document quality/legibility

**Threshold:** 80
**Weight:** 10%

## Overall Underwriting Score

```
Overall Score = (Identity × 0.20) + 
                (Operational × 0.15) + 
                (Cashflow × 0.25) + 
                (Debt × 0.20) + 
                (Fraud × 0.10) + 
                (Documentation × 0.10)
```

## Canonical Entity Model

### Separation of Concerns

The system separates three types of data:

1. **Entities**: Things that exist (Contact, Business, Owner, Application)
2. **Facts**: Measurements and observations (FinancialSnapshot, DebtSummary)
3. **Evidence**: Supporting documents with provenance (Tax returns, bank statements, IDs)

### Entity: Contact
```typescript
{
  id, firstName, lastName, email, phone,
  identityConfidence: { score, level, factors },
  identityVerifications: [ {method, status, performedAt} ],
  ghlContactId // GHL engagement only
}
```

### Entity: Business
```typescript
{
  id, legalName, dbaName, ein,
  structure, industryCode, yearsInBusiness,
  address,
  identityConfidence: { score, level, factors },
  operationalStabilityScore: { score, factors },
  dataSource: [ {sourceType, sourceId, timestamp, confidence} ]
}
```

### Entity: Owner
```typescript
{
  id, contactId, businessId,
  ownershipPercentage, role, isPrimary,
  isGuarantor, guarantorPercentage,
  ssn (encrypted), dateOfBirth,
  identityConfidence,
  onboardingStatus
}
```

### Entity: Application
```typescript
{
  id, businessId, primaryContactId,
  productType, productTypeConfidence,
  requestedAmount, requestedTerm, useOfFunds,
  status, currentStage,
  outcomeScores: { /* 6 dimensions */ },
  underwritingReadiness,
  requiresHumanReview, escalationReasons,
  factIds, evidenceIds,
  questionResponses,
  nextBestActions,
  ghlOpportunityId, resumeUrl // GHL engagement
}
```

### Fact: FinancialSnapshot
```typescript
{
  id, businessId, applicationId,
  periodType, periodStart, periodEnd,
  revenue, costOfGoodsSold, grossProfit,
  operatingExpenses, netIncome,
  cashflowFromOperations, averageBankBalance,
  totalAssets, totalLiabilities,
  confidence: { score, level, factors },
  dataSource,
  evidenceIds // Supporting documents
}
```

### Fact: DebtSummary
```typescript
{
  id, businessId, applicationId,
  totalOutstandingDebt, monthlyDebtPayment,
  debts: [ {creditor, type, amount, payment} ],
  debtToIncomeRatio, debtServiceCoverageRatio,
  confidence, dataSource, evidenceIds
}
```

### Evidence: Document
```typescript
{
  id, applicationId, businessId,
  documentType, fileName, fileUrl,
  extractionStatus, extractedData, extractionConfidence,
  verificationStatus, verifiedBy, verifiedAt,
  hasConflicts, conflicts: [ {field, evidenceValue, existingValue} ],
  uploadedBy, uploadedAt,
  tags, expiresAt
}
```

## Product-Aware Flows

### Supported Loan Products

1. **SBA Loan** - Requires comprehensive documentation and strong fundamentals
2. **Line of Credit** - Emphasizes cashflow and credit history
3. **Equipment Financing** - Focuses on collateral value
4. **Invoice Financing** - Requires AR aging and invoice verification
5. **Invoice Factoring** - Similar to financing but buys receivables
6. **MCA (Merchant Cash Advance)** - Simplified, revenue-focused
7. **Unsure** - Product discovery mode

### Product-Specific Requirements

Each product type has:
- Required outcome dimensions and minimum thresholds
- Critical question list
- Required document types
- Underwriting criteria (min credit score, min years in business, etc.)

Example: SBA Loan
```typescript
{
  requiredOutcomes: [
    IDENTITY_CONFIDENCE,
    OPERATIONAL_STABILITY,
    CASHFLOW_STRENGTH,
    DEBT_BURDEN,
    DOCUMENTATION_READINESS
  ],
  minScoreThresholds: {
    IDENTITY_CONFIDENCE: 80,
    OPERATIONAL_STABILITY: 70,
    CASHFLOW_STRENGTH: 75,
    DEBT_BURDEN: 70,
    DOCUMENTATION_READINESS: 90
  },
  requiredDocumentTypes: [
    'TAX_RETURN', 'BANK_STATEMENT', 'PROFIT_LOSS_STATEMENT',
    'BALANCE_SHEET', 'ARTICLES_OF_INCORPORATION', 'DRIVERS_LICENSE'
  ],
  minCreditScore: 650,
  minYearsInBusiness: 2,
  minAnnualRevenue: 100000
}
```

## Agentic Question Selection

### Value of Information Approach

Instead of asking "What's the next question in the form?", we ask:

**"What information, if obtained, would most reduce uncertainty in our underwriting decision?"**

### Selection Algorithm

1. **Identify Missing Information**
   - Aggregate missing information across all 6 outcome dimensions
   - Each missing item has:
     - Priority (CRITICAL, HIGH, MEDIUM, LOW)
     - Blocks underwriting? (boolean)
     - Estimated value of information (0-100)

2. **Prioritize**
   - Blocking items first
   - Then by priority level
   - Then by value of information

3. **Convert to Actions**
   - Questions: "ASK_QUESTION" with question ID
   - Documents: "REQUEST_DOCUMENT" with document type
   - Verification: "VERIFY_DATA" with data to verify
   - Escalation: "ESCALATE" with reason

4. **Product Adjustment**
   - Boost priority for product-specific questions
   - Example: Equipment questions boosted for equipment financing

### Example Flow

**Application:** $50K equipment financing, 3 years in business

**Iteration 1 - Product Discovery:**
```
Missing: Product type (blocks underwriting)
Action: ASK_QUESTION "What type of financing do you need?"
→ Answer: Equipment Financing
```

**Iteration 2 - Identity Foundation:**
```
Missing: EIN (blocks underwriting, critical)
Missing: Owner identity (blocks underwriting, critical)
Actions:
  1. ASK_QUESTION "What is your EIN?"
  2. ASK_QUESTION "Owner full name and SSN"
  3. REQUEST_DOCUMENT "Driver's License"
```

**Iteration 3 - Equipment & Collateral:**
```
Missing: Equipment details (high priority for equipment loans)
Missing: Equipment value (high priority for equipment loans)
Actions:
  1. ASK_QUESTION "What equipment are you purchasing?"
  2. REQUEST_DOCUMENT "Equipment Appraisal"
  3. ASK_QUESTION "Down payment amount"
```

**Iteration 4 - Cashflow Assessment:**
```
Cashflow Strength: 45/100 (below threshold)
Missing: Bank statements (critical)
Actions:
  1. REQUEST_DOCUMENT "Bank Statements (3 months)"
  2. ASK_QUESTION "Average monthly revenue"
```

**Iteration 5 - Debt Analysis:**
```
Debt Burden: Unknown
Missing: Existing debt information
Actions:
  1. ASK_QUESTION "Total outstanding debt"
  2. ASK_QUESTION "Monthly debt payments"
```

**Decision Point:**
```
All dimensions above threshold
Overall Score: 78/100
Action: TRIGGER_WORKFLOW "underwriting_review"
```

## Confidence Scoring & Provenance

### Confidence Levels

Every data point has a confidence score (0-1):

- **VERY_HIGH** (0.9-1.0): Verified from authoritative source
- **HIGH** (0.7-0.9): From reliable document or verified user input
- **MEDIUM** (0.5-0.7): User-provided, not yet verified
- **LOW** (0.3-0.5): Inferred or estimated
- **VERY_LOW** (0-0.3): Conflicting or unverified

### Data Provenance

Every fact tracks its source:

```typescript
dataSource: {
  sourceType: 'USER_INPUT' | 'DOCUMENT_EXTRACTION' | 
              'EXTERNAL_API' | 'CALCULATED' | 'INFERRED',
  sourceId: string, // e.g., document ID, API call ID
  timestamp: Date,
  confidence: number
}
```

### Conflict Resolution

When evidence conflicts with existing data:

```typescript
{
  field: 'annualRevenue',
  evidenceValue: 1500000, // From tax return
  existingValue: 1200000, // From user input
  confidence: 0.85, // Tax return is authoritative
  resolutionStatus: 'UNRESOLVED' | 'RESOLVED' | 'ESCALATED',
  resolvedValue: 1500000, // Use tax return
  resolvedBy: 'system',
  resolvedAt: Date
}
```

## Escalation Logic

### When to Escalate

Applications are escalated to human review when:

1. **Low Confidence + Below Threshold**
   - Any critical dimension (Identity, Fraud, Cashflow) is below threshold with confidence < 0.5

2. **Fraud Indicators**
   - Fraud Risk score < 30
   - Multiple unresolved data conflicts
   - Failed identity verifications

3. **Overall Poor Quality**
   - Overall score < 40
   - Many low-confidence data points

4. **Policy Exceptions**
   - Applicant requests exception to policy
   - Unusual circumstances requiring judgment

### Escalation Reasons

```typescript
{
  type: 'LOW_CONFIDENCE' | 'DATA_CONFLICT' | 
        'FRAUD_INDICATOR' | 'POLICY_EXCEPTION' | 'COMPLEX_CASE',
  dimension: OutcomeDimension, // If dimension-specific
  description: "Human review required: Low identity confidence, Fraud indicators detected",
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  triggeredAt: Date
}
```

## Integration Architecture

### Firestore: System of Record

**What Goes in Firestore:**
- All entities (Contact, Business, Owner, Application)
- All facts (FinancialSnapshot, DebtSummary)
- All evidence metadata (not files themselves - use GCS)
- All decisions and audit events

**Collections:**
```
/contacts/{contactId}
/businesses/{businessId}
/owners/{ownerId}
/applications/{applicationId}
/financial_snapshots/{snapshotId}
/debt_summaries/{debtId}
/evidence/{evidenceId}
/decisions/{decisionId}
/audit_events/{eventId}
```

### GoHighLevel: Engagement Only

**What Goes in GHL:**
- Contact basic info (name, email, phone)
- Pipeline stage
- Tags (application status)
- Custom field: `application_id` (link back to Firestore)
- Custom field: `resume_url` (secure link to resume application)

**What NEVER Goes in GHL:**
- Detailed financial information
- SSNs or sensitive PII
- Documents
- Complete application data

**GHL is for:**
- Sending SMS/email notifications
- Pipeline visualization
- Contact engagement tracking
- Marketing automation

### n8n: Workflow Orchestration

**Triggered By:** Firestore state changes (via Cloud Functions or webhooks)

**Example Workflows:**

1. **Credit Check Workflow**
   ```
   Trigger: Application reaches CREDIT_CHECK stage
   → Call Experian API
   → Extract credit score
   → Update FinancialSnapshot in Firestore
   → Recalculate outcome scores
   → Send notification via GHL
   ```

2. **Document Collection Workflow**
   ```
   Trigger: Documentation Readiness < 50
   → Determine missing documents
   → Generate secure upload links
   → Send email with links via GHL
   → Set reminder for 3 days
   → Check completion status
   → Escalate if not completed in 7 days
   ```

3. **Multi-Owner Coordination**
   ```
   Trigger: Multiple owners added
   → For each owner:
     → Generate unique secure link
     → Send invitation via GHL
     → Track completion status
   → When all complete:
     → Aggregate owner data
     → Recalculate Identity Confidence
     → Progress to next stage
   ```

## Next Best Actions

The system always provides a prioritized list of next actions:

```typescript
nextBestActions: [
  {
    actionType: 'ASK_QUESTION',
    priority: 10, // 1-10
    questionId: 'q_ein',
    reason: 'Required for underwriting decision. Critical for underwriting assessment.',
    estimatedValueOfInformation: 20,
    blocksUnderwriting: true
  },
  {
    actionType: 'REQUEST_DOCUMENT',
    priority: 9,
    documentType: 'BANK_STATEMENT',
    documentPurpose: 'Assess cashflow and banking activity',
    reason: 'Required for SBA Loan underwriting',
    estimatedValueOfInformation: 25,
    blocksUnderwriting: true
  },
  {
    actionType: 'VERIFY_DATA',
    priority: 8,
    dataToVerify: 'owner_identity',
    verificationMethod: 'ID_VERIFICATION_SERVICE',
    reason: 'Identity or data verification needed',
    estimatedValueOfInformation: 15,
    blocksUnderwriting: false
  }
]
```

## Implementation Benefits

### 1. Reduced Applicant Burden
- Only ask questions that matter for their specific product
- Skip irrelevant questions dynamically
- Request documents when needed, not all at once

### 2. Higher Quality Decisions
- Every decision based on explicit outcome dimensions
- Confidence tracking ensures data quality
- Escalation catches edge cases

### 3. Full Auditability
- Every data point has provenance
- All decisions have explicit reasoning
- Complete audit trail for compliance

### 4. Product Flexibility
- Easy to add new loan products
- Product-specific flows without code changes
- A/B testing of question sequences

### 5. Underwriter Efficiency
- Applications arrive with explicit readiness scores
- Clear gaps identified upfront
- Conflicting data pre-flagged

## Future Enhancements

1. **Machine Learning**
   - Learn optimal question sequences from historical data
   - Predict outcome scores from partial information
   - Detect fraud patterns automatically

2. **Real-time Risk Pricing**
   - Dynamic interest rate based on outcome scores
   - Instant pre-qualification

3. **Automated Underwriting**
   - Auto-approve low-risk applications above thresholds
   - Reserve humans for complex cases only

4. **Continuous Monitoring**
   - Track outcome scores post-approval
   - Early warning for loan performance issues

## Summary

TriIQ Smart Form's outcome-based architecture represents a fundamental shift from form-based to intelligence-based lending intake. By focusing on **what information is needed to reach confident underwriting decisions**, rather than **what questions are next in the form**, the system delivers better applicant experiences, higher quality data, and more defensible decisions.

The system is **agentic** because it makes autonomous decisions about what to ask based on its goal (reach underwriting readiness) and current state (outcome dimension scores). It's **outcome-based** because every action is justified by its expected impact on one of the six underwriting dimensions.

This is the future of financial services intake.
