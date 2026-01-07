/**
 * Canonical Entity Model for Outcome-Based Lending Platform
 * 
 * Separates entities, facts, evidence, and decisions with proper provenance
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  
  // Identity verification
  identityConfidence: ConfidenceScore;
  identityVerifications: IdentityVerification[];
  
  // GHL integration (engagement only)
  ghlContactId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  legalName: string;
  dbaName?: string;
  ein?: string;
  
  // Business structure
  structure: BusinessStructure;
  industryCode?: string; // NAICS
  yearsInBusiness?: number;
  
  // Location
  address?: Address;
  
  // Confidence and verification
  identityConfidence: ConfidenceScore;
  operationalStabilityScore: OperationalStabilityScore;
  
  // Provenance
  dataSource: DataSource[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Owner {
  id: string;
  contactId: string;
  businessId: string;
  
  // Ownership details
  ownershipPercentage: number;
  role: OwnerRole;
  isPrimary: boolean;
  
  // Guarantor status
  isGuarantor: boolean;
  guarantorPercentage?: number; // What % of loan they guarantee
  
  // Identity and verification
  ssn?: string; // Encrypted
  dateOfBirth?: Date;
  identityConfidence: ConfidenceScore;
  
  // Status
  onboardingStatus: OwnerOnboardingStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// APPLICATION & PRODUCT
// ============================================================================

export interface Application {
  id: string;
  businessId: string;
  primaryContactId: string;
  
  // Product selection
  productType: LoanProductType;
  productTypeConfidence: ConfidenceScore; // How sure are we of the right product?
  
  // Loan details
  requestedAmount?: number;
  requestedTerm?: number;
  useOfFunds?: string[];
  
  // Application state
  status: ApplicationStatus;
  currentStage: ApplicationStage;
  
  // Underwriting outcome dimensions
  outcomeScores: UnderwritingOutcomeScores;
  
  // Overall readiness
  underwritingReadiness: number; // 0-1
  requiresHumanReview: boolean;
  escalationReasons: EscalationReason[];
  
  // Evidence and facts
  factIds: string[]; // References to FinancialSnapshot, DebtSummary, etc.
  evidenceIds: string[]; // References to Documents
  
  // Question responses
  questionResponses: Record<string, QuestionResponse>; // questionId -> response
  completedQuestions: string[]; // Question IDs that have been answered
  
  // Next actions
  nextBestActions: NextBestAction[];
  
  // GHL integration
  ghlOpportunityId?: string;
  resumeUrl?: string; // Secure URL for applicant to resume
  
  // Workflow
  workflowExecutions: string[]; // References to WorkflowExecution
  
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  completedAt?: Date;
}

export enum LoanProductType {
  SBA_LOAN = 'SBA_LOAN',
  LINE_OF_CREDIT = 'LINE_OF_CREDIT',
  EQUIPMENT_FINANCING = 'EQUIPMENT_FINANCING',
  INVOICE_FINANCING = 'INVOICE_FINANCING',
  INVOICE_FACTORING = 'INVOICE_FACTORING',
  MCA = 'MCA', // Merchant Cash Advance
  UNSURE = 'UNSURE'
}

export interface ProductModule {
  id: string;
  productType: LoanProductType;
  
  // Product-specific requirements
  requiredOutcomes: OutcomeDimension[];
  minScoreThresholds: Partial<Record<OutcomeDimension, number>>;
  
  // Product-specific questions
  criticalQuestionIds: string[];
  
  // Underwriting criteria
  minCreditScore?: number;
  minYearsInBusiness?: number;
  minAnnualRevenue?: number;
  maxDebtServiceCoverageRatio?: number;
  
  // Document requirements
  requiredDocumentTypes: DocumentType[];
  
  active: boolean;
}

// ============================================================================
// FACTS (Time-series financial data)
// ============================================================================

export interface FinancialSnapshot {
  id: string;
  businessId: string;
  applicationId: string;
  
  // Period
  periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'YTD';
  periodStart: Date;
  periodEnd: Date;
  
  // Revenue & Cashflow
  revenue?: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  netIncome?: number;
  
  cashflowFromOperations?: number;
  averageBankBalance?: number;
  
  // Assets & Liabilities
  totalAssets?: number;
  totalLiabilities?: number;
  
  // Confidence & provenance
  confidence: ConfidenceScore;
  dataSource: DataSource;
  evidenceIds: string[]; // Supporting documents
  
  createdAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface DebtSummary {
  id: string;
  businessId: string;
  applicationId: string;
  
  // Debt details
  totalOutstandingDebt: number;
  monthlyDebtPayment: number;
  
  // Individual debts
  debts: DebtItem[];
  
  // Calculated ratios
  debtToIncomeRatio?: number;
  debtServiceCoverageRatio?: number;
  
  // Confidence & provenance
  confidence: ConfidenceScore;
  dataSource: DataSource;
  evidenceIds: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtItem {
  creditor: string;
  type: 'TERM_LOAN' | 'LINE_OF_CREDIT' | 'CREDIT_CARD' | 'MERCHANT_CASH_ADVANCE' | 'OTHER';
  originalAmount: number;
  outstandingBalance: number;
  monthlyPayment: number;
  interestRate?: number;
  maturityDate?: Date;
}

// ============================================================================
// EVIDENCE (Documents with extraction state)
// ============================================================================

export interface Evidence {
  id: string;
  applicationId: string;
  businessId: string;
  
  // Document details
  documentType: DocumentType;
  fileName: string;
  fileUrl: string; // GCS or similar
  fileSize: number;
  mimeType: string;
  
  // Extraction state
  extractionStatus: ExtractionStatus;
  extractedData?: Record<string, any>;
  extractionConfidence?: number;
  
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  
  // Conflicts and issues
  hasConflicts: boolean;
  conflicts?: DataConflict[];
  
  // Provenance
  uploadedBy: string;
  uploadedAt: Date;
  
  // Metadata
  tags?: string[];
  expiresAt?: Date; // For documents that expire
}

export enum DocumentType {
  // Identity
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  
  // Business formation
  ARTICLES_OF_INCORPORATION = 'ARTICLES_OF_INCORPORATION',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  EIN_LETTER = 'EIN_LETTER',
  
  // Financial
  TAX_RETURN = 'TAX_RETURN',
  BANK_STATEMENT = 'BANK_STATEMENT',
  PROFIT_LOSS_STATEMENT = 'PROFIT_LOSS_STATEMENT',
  BALANCE_SHEET = 'BALANCE_SHEET',
  ACCOUNTS_RECEIVABLE_AGING = 'ACCOUNTS_RECEIVABLE_AGING',
  ACCOUNTS_PAYABLE_AGING = 'ACCOUNTS_PAYABLE_AGING',
  
  // Credit
  CREDIT_REPORT = 'CREDIT_REPORT',
  
  // Collateral
  EQUIPMENT_APPRAISAL = 'EQUIPMENT_APPRAISAL',
  PROPERTY_DEED = 'PROPERTY_DEED',
  VEHICLE_TITLE = 'VEHICLE_TITLE',
  
  // Other
  VOIDED_CHECK = 'VOIDED_CHECK',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER'
}

export enum ExtractionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NOT_REQUIRED = 'NOT_REQUIRED'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  NEEDS_CLARIFICATION = 'NEEDS_CLARIFICATION'
}

export interface DataConflict {
  field: string;
  evidenceValue: any;
  existingValue: any;
  confidence: number;
  resolutionStatus: 'UNRESOLVED' | 'RESOLVED' | 'ESCALATED';
  resolvedValue?: any;
  resolvedBy?: string;
  resolvedAt?: Date;
}

// ============================================================================
// UNDERWRITING OUTCOMES
// ============================================================================

export enum OutcomeDimension {
  IDENTITY_CONFIDENCE = 'IDENTITY_CONFIDENCE',
  OPERATIONAL_STABILITY = 'OPERATIONAL_STABILITY',
  CASHFLOW_STRENGTH = 'CASHFLOW_STRENGTH',
  DEBT_BURDEN = 'DEBT_BURDEN',
  FRAUD_RISK = 'FRAUD_RISK',
  DOCUMENTATION_READINESS = 'DOCUMENTATION_READINESS'
}

export interface UnderwritingOutcomeScores {
  identityConfidence: OutcomeScore;
  operationalStability: OutcomeScore;
  cashflowStrength: OutcomeScore;
  debtBurden: OutcomeScore;
  fraudRisk: OutcomeScore;
  documentationReadiness: OutcomeScore;
  
  // Aggregate
  overallScore: number; // 0-100
  lastCalculatedAt: Date;
}

export interface OutcomeScore {
  dimension: OutcomeDimension;
  score: number; // 0-100
  confidence: ConfidenceScore;
  
  // Contributing factors
  contributingFactors: ContributingFactor[];
  
  // What's missing
  missingInformation: MissingInformation[];
  
  // Thresholds
  isAboveThreshold: boolean;
  thresholdValue: number;
  
  lastUpdatedAt: Date;
}

export interface ContributingFactor {
  factorId: string;
  factorType: 'QUESTION_ANSWER' | 'DOCUMENT' | 'EXTERNAL_DATA' | 'CALCULATED';
  description: string;
  impact: number; // -100 to +100
  confidence: number; // 0-1
}

export interface MissingInformation {
  informationType: 'QUESTION' | 'DOCUMENT' | 'VERIFICATION';
  questionId?: string;
  documentType?: DocumentType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  blocksUnderwriting: boolean;
  estimatedValueOfInformation: number; // Expected reduction in uncertainty
}

// ============================================================================
// CONFIDENCE & PROVENANCE
// ============================================================================

export interface ConfidenceScore {
  score: number; // 0-1
  level: ConfidenceLevel;
  factors: string[];
  lastUpdatedAt: Date;
}

export enum ConfidenceLevel {
  VERY_LOW = 'VERY_LOW',     // 0-0.3
  LOW = 'LOW',               // 0.3-0.5
  MEDIUM = 'MEDIUM',         // 0.5-0.7
  HIGH = 'HIGH',             // 0.7-0.9
  VERY_HIGH = 'VERY_HIGH'    // 0.9-1.0
}

export interface DataSource {
  sourceType: 'USER_INPUT' | 'DOCUMENT_EXTRACTION' | 'EXTERNAL_API' | 'CALCULATED' | 'INFERRED';
  sourceId?: string;
  timestamp: Date;
  confidence?: number;
}

export interface IdentityVerification {
  method: 'DOCUMENT' | 'KBA' | 'DATABASE' | 'BIOMETRIC';
  status: 'PASSED' | 'FAILED' | 'PENDING';
  performedAt: Date;
  details?: Record<string, any>;
}

export interface OperationalStabilityScore {
  score: number; // 0-100
  factors: {
    yearsInBusiness: number;
    revenueConsistency: number;
    industryStability: number;
    ownershipStability: number;
  };
  lastCalculatedAt: Date;
}

// ============================================================================
// ACTIONS & DECISIONS
// ============================================================================

export interface NextBestAction {
  actionType: 'ASK_QUESTION' | 'REQUEST_DOCUMENT' | 'VERIFY_DATA' | 'ESCALATE' | 'TRIGGER_WORKFLOW';
  priority: number; // 1-10
  
  // For questions
  questionId?: string;
  targetOwnerId?: string; // If owner-specific
  
  // For documents
  documentType?: DocumentType;
  documentPurpose?: string;
  
  // For verification
  dataToVerify?: string;
  verificationMethod?: string;
  
  // For workflows
  workflowType?: string;
  
  // Context
  reason: string;
  estimatedValueOfInformation: number;
  blocksUnderwriting: boolean;
}

export interface EscalationReason {
  type: 'LOW_CONFIDENCE' | 'DATA_CONFLICT' | 'FRAUD_INDICATOR' | 'POLICY_EXCEPTION' | 'COMPLEX_CASE';
  dimension?: OutcomeDimension;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeredAt: Date;
}

export interface Decision {
  id: string;
  applicationId: string;
  
  decisionType: 'PRELIMINARY' | 'FINAL' | 'CONDITIONAL';
  outcome: 'APPROVED' | 'DENIED' | 'CONDITIONAL_APPROVAL';
  
  // Decision details
  approvedAmount?: number;
  approvedTerm?: number;
  interestRate?: number;
  conditions?: DecisionCondition[];
  
  // Reasoning
  outcomeScores: UnderwritingOutcomeScores;
  primaryReasons: string[];
  
  // Decision maker
  decidedBy: 'SYSTEM' | 'UNDERWRITER' | 'COMMITTEE';
  deciderId?: string;
  decidedAt: Date;
  
  // Audit
  auditTrail: string[];
}

export interface DecisionCondition {
  condition: string;
  status: 'PENDING' | 'SATISFIED' | 'WAIVED';
  dueDate?: Date;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export enum BusinessStructure {
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  PARTNERSHIP = 'PARTNERSHIP',
  LLC = 'LLC',
  S_CORP = 'S_CORP',
  C_CORP = 'C_CORP',
  NON_PROFIT = 'NON_PROFIT'
}

export enum OwnerRole {
  OWNER = 'OWNER',
  CO_OWNER = 'CO_OWNER',
  GUARANTOR = 'GUARANTOR',
  AUTHORIZED_SIGNER = 'AUTHORIZED_SIGNER'
}

export enum OwnerOnboardingStatus {
  INVITED = 'INVITED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED'
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_INFO = 'PENDING_INFO',
  APPROVED = 'APPROVED',
  CONDITIONALLY_APPROVED = 'CONDITIONALLY_APPROVED',
  DENIED = 'DENIED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum ApplicationStage {
  PRODUCT_DISCOVERY = 'PRODUCT_DISCOVERY',
  BUSINESS_IDENTITY = 'BUSINESS_IDENTITY',
  OWNER_IDENTITY = 'OWNER_IDENTITY',
  FINANCIAL_ASSESSMENT = 'FINANCIAL_ASSESSMENT',
  DEBT_ANALYSIS = 'DEBT_ANALYSIS',
  DOCUMENT_COLLECTION = 'DOCUMENT_COLLECTION',
  VERIFICATION = 'VERIFICATION',
  UNDERWRITING = 'UNDERWRITING',
  DECISION = 'DECISION'
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface QuestionResponse {
  questionId: string;
  value: any;
  answeredBy: string; // Contact ID or user ID
  answeredAt: Date;
  confidence?: number;
  dataSource: DataSource;
}
