export interface ApplicationState {
  id: string;
  businessName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  currentStage: ApplicationStage;
  owners: ApplicationOwner[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Collected data
  responses: Record<string, QuestionResponse>;
  
  // Risk and underwriting
  riskScore?: number;
  underwritingReadiness: number;
  
  // Workflow state
  nextQuestions: string[];
  completedQuestions: string[];
  
  // Audit trail
  auditLog: AuditEntry[];
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_INFO = 'NEEDS_INFO'
}

export enum ApplicationStage {
  BASIC_INFO = 'BASIC_INFO',
  BUSINESS_DETAILS = 'BUSINESS_DETAILS',
  FINANCIAL_INFO = 'FINANCIAL_INFO',
  CREDIT_CHECK = 'CREDIT_CHECK',
  DOCUMENT_COLLECTION = 'DOCUMENT_COLLECTION',
  FINAL_REVIEW = 'FINAL_REVIEW'
}

export interface ApplicationOwner {
  id: string;
  name: string;
  email: string;
  role: OwnerRole;
  sharePercentage?: number;
  isPrimary: boolean;
  status: OwnerStatus;
}

export enum OwnerRole {
  OWNER = 'OWNER',
  CO_OWNER = 'CO_OWNER',
  GUARANTOR = 'GUARANTOR'
}

export enum OwnerStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface QuestionResponse {
  questionId: string;
  value: any;
  answeredBy: string;
  answeredAt: Date;
  validatedAt?: Date;
  confidence?: number;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export enum AuditAction {
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  QUESTION_ANSWERED = 'QUESTION_ANSWERED',
  QUESTION_UPDATED = 'QUESTION_UPDATED',
  OWNER_ADDED = 'OWNER_ADDED',
  OWNER_UPDATED = 'OWNER_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  STAGE_CHANGED = 'STAGE_CHANGED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  RISK_SCORE_UPDATED = 'RISK_SCORE_UPDATED',
  WORKFLOW_TRIGGERED = 'WORKFLOW_TRIGGERED',
  NOTIFICATION_SENT = 'NOTIFICATION_SENT'
}
