import { Question, QuestionType, QuestionCategory, RiskDimension } from '../models/Question';
import { ApplicationStage, OwnerRole } from '../models/Application';

export class QuestionRepository {
  private questions: Question[];
  
  constructor() {
    this.questions = this.initializeQuestions();
  }
  
  getAll(): Question[] {
    return this.questions;
  }
  
  getById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }
  
  getByCategory(category: QuestionCategory): Question[] {
    return this.questions.filter(q => q.category === category);
  }
  
  getByStage(stage: ApplicationStage): Question[] {
    return this.questions.filter(q => q.applicableStages.includes(stage));
  }
  
  private initializeQuestions(): Question[] {
    return [
      // Basic Info Questions
      {
        id: 'q_business_name',
        text: 'What is your business name?',
        type: QuestionType.TEXT,
        category: QuestionCategory.BASIC_INFO,
        informationValue: 10,
        applicableStages: [ApplicationStage.BASIC_INFO],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.COMPLIANCE_RISK, weight: 2, direction: 'NEUTRAL' },
        underwritingWeight: 9,
      },
      {
        id: 'q_business_structure',
        text: 'What is your business structure?',
        type: QuestionType.SELECT,
        category: QuestionCategory.BUSINESS_STRUCTURE,
        informationValue: 9,
        applicableStages: [ApplicationStage.BASIC_INFO, ApplicationStage.BUSINESS_DETAILS],
        options: [
          { value: 'sole_proprietorship', label: 'Sole Proprietorship', informationGain: 5 },
          { value: 'llc', label: 'LLC', informationGain: 7 },
          { value: 'corporation', label: 'Corporation', informationGain: 8 },
          { value: 'partnership', label: 'Partnership', informationGain: 6 },
        ],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.OPERATIONAL_RISK, weight: 5, direction: 'NEUTRAL' },
        underwritingWeight: 8,
      },
      {
        id: 'q_years_in_business',
        text: 'How many years has your business been operating?',
        type: QuestionType.NUMBER,
        category: QuestionCategory.BASIC_INFO,
        informationValue: 9,
        applicableStages: [ApplicationStage.BASIC_INFO, ApplicationStage.BUSINESS_DETAILS],
        validation: { required: true, min: 0, max: 100 },
        riskImpact: { dimension: RiskDimension.CREDIT_RISK, weight: 7, direction: 'POSITIVE' },
        underwritingWeight: 9,
        helpText: 'Include years under previous ownership if applicable',
      },
      {
        id: 'q_ein',
        text: 'What is your Employer Identification Number (EIN)?',
        type: QuestionType.EIN,
        category: QuestionCategory.BASIC_INFO,
        informationValue: 8,
        applicableStages: [ApplicationStage.BASIC_INFO],
        validation: { required: true, pattern: '^\\d{2}-\\d{7}$' },
        riskImpact: { dimension: RiskDimension.COMPLIANCE_RISK, weight: 3, direction: 'NEUTRAL' },
        underwritingWeight: 8,
        complianceNotes: 'Required for tax reporting and identity verification',
      },
      
      // Financial Questions
      {
        id: 'q_annual_revenue',
        text: 'What is your estimated annual revenue?',
        type: QuestionType.CURRENCY,
        category: QuestionCategory.FINANCIAL_METRICS,
        informationValue: 10,
        applicableStages: [ApplicationStage.BUSINESS_DETAILS, ApplicationStage.FINANCIAL_INFO],
        validation: { required: true, min: 0 },
        riskImpact: { dimension: RiskDimension.LIQUIDITY_RISK, weight: 9, direction: 'POSITIVE' },
        underwritingWeight: 10,
      },
      {
        id: 'q_monthly_cash_flow',
        text: 'What is your average monthly cash flow?',
        type: QuestionType.CURRENCY,
        category: QuestionCategory.FINANCIAL_METRICS,
        informationValue: 9,
        applicableStages: [ApplicationStage.FINANCIAL_INFO],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.LIQUIDITY_RISK, weight: 8, direction: 'POSITIVE' },
        underwritingWeight: 9,
        helpText: 'Net cash flow after expenses',
      },
      {
        id: 'q_outstanding_debt',
        text: 'What is your total outstanding business debt?',
        type: QuestionType.CURRENCY,
        category: QuestionCategory.FINANCIAL_METRICS,
        informationValue: 9,
        applicableStages: [ApplicationStage.FINANCIAL_INFO],
        validation: { required: true, min: 0 },
        riskImpact: { dimension: RiskDimension.CREDIT_RISK, weight: 8, direction: 'NEGATIVE' },
        underwritingWeight: 9,
      },
      
      // Loan Details
      {
        id: 'q_loan_amount',
        text: 'How much funding are you requesting?',
        type: QuestionType.CURRENCY,
        category: QuestionCategory.USE_OF_FUNDS,
        informationValue: 10,
        applicableStages: [ApplicationStage.BASIC_INFO, ApplicationStage.BUSINESS_DETAILS],
        validation: { required: true, min: 1000 },
        riskImpact: { dimension: RiskDimension.CREDIT_RISK, weight: 6, direction: 'NEUTRAL' },
        underwritingWeight: 10,
      },
      {
        id: 'q_use_of_funds',
        text: 'How will you use the loan proceeds?',
        type: QuestionType.MULTI_SELECT,
        category: QuestionCategory.USE_OF_FUNDS,
        informationValue: 8,
        applicableStages: [ApplicationStage.BUSINESS_DETAILS],
        options: [
          { value: 'working_capital', label: 'Working Capital' },
          { value: 'equipment', label: 'Equipment Purchase' },
          { value: 'inventory', label: 'Inventory' },
          { value: 'expansion', label: 'Business Expansion' },
          { value: 'refinance', label: 'Debt Refinancing' },
          { value: 'other', label: 'Other' },
        ],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.OPERATIONAL_RISK, weight: 5, direction: 'NEUTRAL' },
        underwritingWeight: 7,
      },
      
      // Credit History
      {
        id: 'q_personal_credit_score',
        text: 'What is your personal credit score range?',
        type: QuestionType.SELECT,
        category: QuestionCategory.CREDIT_HISTORY,
        informationValue: 9,
        applicableStages: [ApplicationStage.CREDIT_CHECK],
        applicableRoles: [OwnerRole.OWNER, OwnerRole.CO_OWNER, OwnerRole.GUARANTOR],
        options: [
          { value: '750+', label: '750+' },
          { value: '700-749', label: '700-749' },
          { value: '650-699', label: '650-699' },
          { value: '600-649', label: '600-649' },
          { value: '<600', label: 'Below 600' },
        ],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.CREDIT_RISK, weight: 9, direction: 'POSITIVE' },
        underwritingWeight: 10,
      },
      {
        id: 'q_bankruptcy_history',
        text: 'Have you or your business filed for bankruptcy in the last 7 years?',
        type: QuestionType.BOOLEAN,
        category: QuestionCategory.CREDIT_HISTORY,
        informationValue: 8,
        applicableStages: [ApplicationStage.CREDIT_CHECK],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.CREDIT_RISK, weight: 10, direction: 'NEGATIVE' },
        underwritingWeight: 9,
      },
      
      // Collateral
      {
        id: 'q_collateral_available',
        text: 'Do you have collateral available to secure the loan?',
        type: QuestionType.BOOLEAN,
        category: QuestionCategory.COLLATERAL,
        informationValue: 7,
        applicableStages: [ApplicationStage.BUSINESS_DETAILS, ApplicationStage.FINANCIAL_INFO],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.CREDIT_RISK, weight: 7, direction: 'POSITIVE' },
        underwritingWeight: 7,
      },
      {
        id: 'q_collateral_type',
        text: 'What type of collateral can you provide?',
        type: QuestionType.MULTI_SELECT,
        category: QuestionCategory.COLLATERAL,
        informationValue: 7,
        applicableStages: [ApplicationStage.FINANCIAL_INFO],
        prerequisites: [
          { questionId: 'q_collateral_available', operator: 'EQUALS', value: true },
        ],
        options: [
          { value: 'real_estate', label: 'Real Estate' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'inventory', label: 'Inventory' },
          { value: 'accounts_receivable', label: 'Accounts Receivable' },
          { value: 'other', label: 'Other Assets' },
        ],
        riskImpact: { dimension: RiskDimension.CREDIT_RISK, weight: 6, direction: 'POSITIVE' },
        underwritingWeight: 6,
      },
      
      // Owner Information
      {
        id: 'q_owner_count',
        text: 'How many owners does your business have?',
        type: QuestionType.NUMBER,
        category: QuestionCategory.OWNER_INFO,
        informationValue: 8,
        applicableStages: [ApplicationStage.BUSINESS_DETAILS],
        validation: { required: true, min: 1, max: 20 },
        riskImpact: { dimension: RiskDimension.OPERATIONAL_RISK, weight: 3, direction: 'NEUTRAL' },
        underwritingWeight: 6,
      },
      {
        id: 'q_owner_name',
        text: 'What is your full name?',
        type: QuestionType.TEXT,
        category: QuestionCategory.OWNER_INFO,
        informationValue: 7,
        applicableStages: [ApplicationStage.BUSINESS_DETAILS],
        applicableRoles: [OwnerRole.OWNER, OwnerRole.CO_OWNER, OwnerRole.GUARANTOR],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.COMPLIANCE_RISK, weight: 2, direction: 'NEUTRAL' },
        underwritingWeight: 7,
        complianceNotes: 'Required for KYC compliance',
      },
      {
        id: 'q_owner_ssn',
        text: 'What is your Social Security Number?',
        type: QuestionType.SSN,
        category: QuestionCategory.OWNER_INFO,
        informationValue: 8,
        applicableStages: [ApplicationStage.BUSINESS_DETAILS, ApplicationStage.CREDIT_CHECK],
        applicableRoles: [OwnerRole.OWNER, OwnerRole.CO_OWNER, OwnerRole.GUARANTOR],
        validation: { required: true, pattern: '^\\d{3}-\\d{2}-\\d{4}$' },
        riskImpact: { dimension: RiskDimension.COMPLIANCE_RISK, weight: 3, direction: 'NEUTRAL' },
        underwritingWeight: 8,
        complianceNotes: 'Required for credit check and identity verification',
      },
      {
        id: 'q_ownership_percentage',
        text: 'What percentage of the business do you own?',
        type: QuestionType.NUMBER,
        category: QuestionCategory.OWNER_INFO,
        informationValue: 7,
        applicableStages: [ApplicationStage.BUSINESS_DETAILS],
        applicableRoles: [OwnerRole.OWNER, OwnerRole.CO_OWNER],
        validation: { required: true, min: 0, max: 100 },
        riskImpact: { dimension: RiskDimension.OPERATIONAL_RISK, weight: 4, direction: 'NEUTRAL' },
        underwritingWeight: 6,
      },
      
      // Compliance
      {
        id: 'q_business_address',
        text: 'What is your business address?',
        type: QuestionType.ADDRESS,
        category: QuestionCategory.COMPLIANCE,
        informationValue: 7,
        applicableStages: [ApplicationStage.BASIC_INFO],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.COMPLIANCE_RISK, weight: 2, direction: 'NEUTRAL' },
        underwritingWeight: 7,
      },
      {
        id: 'q_business_phone',
        text: 'What is your business phone number?',
        type: QuestionType.PHONE,
        category: QuestionCategory.COMPLIANCE,
        informationValue: 6,
        applicableStages: [ApplicationStage.BASIC_INFO],
        validation: { required: true },
        riskImpact: { dimension: RiskDimension.COMPLIANCE_RISK, weight: 2, direction: 'NEUTRAL' },
        underwritingWeight: 6,
      },
    ];
  }
}

export const questionRepository = new QuestionRepository();
