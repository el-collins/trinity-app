import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { ApplicationState } from '../types/Application';
import { WorkflowDefinition, TriggerCondition } from '../types/Workflow';

export interface N8NWebhookPayload {
  event: string;
  applicationId: string;
  data: any;
  timestamp: string;
}

export class N8NService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: config.n8n.webhookUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (config.n8n.apiKey) {
      this.client.defaults.headers['X-N8N-API-KEY'] = config.n8n.apiKey;
    }
  }
  
  /**
   * Trigger a workflow in n8n via webhook
   */
  async triggerWorkflow(
    workflowPath: string,
    payload: N8NWebhookPayload
  ): Promise<any> {
    try {
      const response = await this.client.post(`/${workflowPath}`, payload);
      return response.data;
    } catch (error: any) {
      console.error(`Error triggering n8n workflow ${workflowPath}:`, error.message);
      throw new Error(`Failed to trigger workflow: ${error.message}`);
    }
  }
  
  /**
   * Trigger credit check workflow
   */
  async triggerCreditCheck(application: ApplicationState): Promise<any> {
    const payload: N8NWebhookPayload = {
      event: 'credit_check_requested',
      applicationId: application.id,
      data: {
        businessName: application.businessName,
        applicantEmail: application.applicantEmail,
        owners: application.owners,
      },
      timestamp: new Date().toISOString(),
    };
    
    return this.triggerWorkflow('credit-check', payload);
  }
  
  /**
   * Trigger document collection workflow
   */
  async triggerDocumentCollection(
    application: ApplicationState,
    documents: string[]
  ): Promise<any> {
    const payload: N8NWebhookPayload = {
      event: 'documents_requested',
      applicationId: application.id,
      data: {
        businessName: application.businessName,
        applicantEmail: application.applicantEmail,
        requiredDocuments: documents,
      },
      timestamp: new Date().toISOString(),
    };
    
    return this.triggerWorkflow('document-collection', payload);
  }
  
  /**
   * Trigger underwriting review workflow
   */
  async triggerUnderwritingReview(application: ApplicationState): Promise<any> {
    const payload: N8NWebhookPayload = {
      event: 'underwriting_review_requested',
      applicationId: application.id,
      data: {
        businessName: application.businessName,
        applicantEmail: application.applicantEmail,
        riskScore: application.riskScore,
        underwritingReadiness: application.underwritingReadiness,
        responses: application.responses,
      },
      timestamp: new Date().toISOString(),
    };
    
    return this.triggerWorkflow('underwriting-review', payload);
  }
  
  /**
   * Trigger multi-owner coordination workflow
   */
  async triggerOwnerCoordination(
    application: ApplicationState,
    ownerIds: string[]
  ): Promise<any> {
    const payload: N8NWebhookPayload = {
      event: 'owner_coordination_required',
      applicationId: application.id,
      data: {
        businessName: application.businessName,
        owners: application.owners.filter(o => ownerIds.includes(o.id)),
      },
      timestamp: new Date().toISOString(),
    };
    
    return this.triggerWorkflow('owner-coordination', payload);
  }
  
  /**
   * Trigger compliance check workflow
   */
  async triggerComplianceCheck(application: ApplicationState): Promise<any> {
    const payload: N8NWebhookPayload = {
      event: 'compliance_check_requested',
      applicationId: application.id,
      data: {
        businessName: application.businessName,
        applicantEmail: application.applicantEmail,
        responses: application.responses,
        owners: application.owners,
      },
      timestamp: new Date().toISOString(),
    };
    
    return this.triggerWorkflow('compliance-check', payload);
  }
  
  /**
   * Evaluate workflow triggers and execute matching workflows
   */
  async evaluateAndTrigger(
    application: ApplicationState,
    workflows: WorkflowDefinition[]
  ): Promise<string[]> {
    const triggeredWorkflows: string[] = [];
    
    for (const workflow of workflows) {
      if (!workflow.enabled) {
        continue;
      }
      
      const shouldTrigger = this.evaluateTriggers(workflow.triggerConditions, application);
      
      if (shouldTrigger && workflow.n8nWebhookUrl) {
        try {
          const payload: N8NWebhookPayload = {
            event: workflow.id,
            applicationId: application.id,
            data: application,
            timestamp: new Date().toISOString(),
          };
          
          await this.client.post(workflow.n8nWebhookUrl, payload);
          triggeredWorkflows.push(workflow.id);
        } catch (error: any) {
          console.error(`Error triggering workflow ${workflow.id}:`, error.message);
        }
      }
    }
    
    return triggeredWorkflows;
  }
  
  /**
   * Evaluate if trigger conditions are met
   */
  private evaluateTriggers(
    conditions: TriggerCondition[],
    application: ApplicationState
  ): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'STATUS_CHANGE':
          return application.status === condition.value;
        case 'STAGE_CHANGE':
          return application.currentStage === condition.value;
        case 'RISK_SCORE_THRESHOLD':
          if (!application.riskScore) return false;
          return this.evaluateOperator(application.riskScore, condition.operator, condition.value);
        case 'READINESS_THRESHOLD':
          return this.evaluateOperator(
            application.underwritingReadiness,
            condition.operator,
            condition.value
          );
        case 'QUESTION_ANSWERED':
          return application.completedQuestions.includes(condition.value);
        default:
          return false;
      }
    });
  }
  
  private evaluateOperator(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
      case 'gt':
        return value > threshold;
      case '>=':
      case 'gte':
        return value >= threshold;
      case '<':
      case 'lt':
        return value < threshold;
      case '<=':
      case 'lte':
        return value <= threshold;
      case '==':
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }
}

export const n8nService = new N8NService();
