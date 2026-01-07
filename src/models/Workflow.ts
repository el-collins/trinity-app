export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggerConditions: TriggerCondition[];
  actions: WorkflowAction[];
  n8nWebhookUrl?: string;
  enabled: boolean;
}

export interface TriggerCondition {
  type: TriggerType;
  field?: string;
  operator: string;
  value: any;
}

export enum TriggerType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  STAGE_CHANGE = 'STAGE_CHANGE',
  RISK_SCORE_THRESHOLD = 'RISK_SCORE_THRESHOLD',
  READINESS_THRESHOLD = 'READINESS_THRESHOLD',
  QUESTION_ANSWERED = 'QUESTION_ANSWERED',
  OWNER_ACTION = 'OWNER_ACTION',
  TIME_BASED = 'TIME_BASED',
  MANUAL = 'MANUAL'
}

export interface WorkflowAction {
  type: ActionType;
  config: Record<string, any>;
  order: number;
}

export enum ActionType {
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  UPDATE_STATUS = 'UPDATE_STATUS',
  ASSIGN_TASK = 'ASSIGN_TASK',
  REQUEST_DOCUMENT = 'REQUEST_DOCUMENT',
  TRIGGER_CREDIT_CHECK = 'TRIGGER_CREDIT_CHECK',
  SEND_TO_UNDERWRITING = 'SEND_TO_UNDERWRITING',
  GENERATE_REPORT = 'GENERATE_REPORT',
  WEBHOOK = 'WEBHOOK',
  N8N_WORKFLOW = 'N8N_WORKFLOW'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  applicationId: string;
  startedAt: Date;
  completedAt?: Date;
  status: WorkflowExecutionStatus;
  results: Record<string, any>;
  error?: string;
}

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}
