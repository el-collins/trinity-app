export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: QuestionCategory;
  
  // Information value for next-best question selection
  informationValue: number;
  
  // Dependencies and prerequisites
  dependsOn?: string[];
  prerequisites?: QuestionPrerequisite[];
  
  // Validation rules
  validation?: ValidationRule;
  
  // Options for select/multi-select questions
  options?: QuestionOption[];
  
  // Help text and compliance info
  helpText?: string;
  complianceNotes?: string;
  
  // Targeting
  applicableStages: ApplicationStage[];
  applicableRoles?: OwnerRole[];
  
  // Scoring and underwriting impact
  riskImpact: RiskImpact;
  underwritingWeight: number;
}

export enum QuestionType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  CURRENCY = 'CURRENCY',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  BOOLEAN = 'BOOLEAN',
  FILE_UPLOAD = 'FILE_UPLOAD',
  SSN = 'SSN',
  EIN = 'EIN',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  ADDRESS = 'ADDRESS'
}

export enum QuestionCategory {
  BASIC_INFO = 'BASIC_INFO',
  BUSINESS_STRUCTURE = 'BUSINESS_STRUCTURE',
  FINANCIAL_METRICS = 'FINANCIAL_METRICS',
  CREDIT_HISTORY = 'CREDIT_HISTORY',
  COLLATERAL = 'COLLATERAL',
  USE_OF_FUNDS = 'USE_OF_FUNDS',
  OWNER_INFO = 'OWNER_INFO',
  COMPLIANCE = 'COMPLIANCE'
}

export interface QuestionPrerequisite {
  questionId: string;
  operator: PrerequisiteOperator;
  value: any;
}

export enum PrerequisiteOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  EXISTS = 'EXISTS',
  NOT_EXISTS = 'NOT_EXISTS'
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  informationGain?: number;
}

export interface RiskImpact {
  dimension: RiskDimension;
  weight: number;
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export enum RiskDimension {
  CREDIT_RISK = 'CREDIT_RISK',
  OPERATIONAL_RISK = 'OPERATIONAL_RISK',
  MARKET_RISK = 'MARKET_RISK',
  LIQUIDITY_RISK = 'LIQUIDITY_RISK',
  COMPLIANCE_RISK = 'COMPLIANCE_RISK'
}

export interface QuestionSelectionContext {
  applicationState: import('./Application').ApplicationState;
  availableQuestions: Question[];
  informationGaps: string[];
  priorityAreas: QuestionCategory[];
}

import { ApplicationStage, OwnerRole } from './Application';
