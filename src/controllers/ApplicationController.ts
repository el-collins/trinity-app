import { Request, Response } from 'express';
import { firestoreService } from '../services/FirestoreService';
import { questionSelectionEngine } from '../services/QuestionSelectionEngine';
import { questionRepository } from '../services/QuestionRepository';
import { goHighLevelService } from '../services/GoHighLevelService';
import { n8nService } from '../services/N8NService';
import { ApplicationStatus, ApplicationStage, AuditAction } from '../models/Application';

export class ApplicationController {
  /**
   * Create a new application
   */
  async createApplication(req: Request, res: Response): Promise<void> {
    try {
      const { businessName, applicantEmail, owners } = req.body;
      
      if (!businessName || !applicantEmail) {
        res.status(400).json({ error: 'businessName and applicantEmail are required' });
        return;
      }
      
      const application = await firestoreService.createApplication({
        businessName,
        applicantEmail,
        owners: owners || [],
        status: ApplicationStatus.DRAFT,
        currentStage: ApplicationStage.BASIC_INFO,
      });
      
      // Get initial questions
      const allQuestions = questionRepository.getAll();
      const nextQuestions = questionSelectionEngine.selectNextQuestions(
        application,
        allQuestions,
        5
      );
      
      application.nextQuestions = nextQuestions.map(q => q.id);
      await firestoreService.updateApplication(application.id, {
        nextQuestions: application.nextQuestions,
      });
      
      // Notify via GoHighLevel
      try {
        await goHighLevelService.notifyApplicationStatus({
          email: applicantEmail,
          businessName,
          status: 'STARTED',
          nextSteps: 'Complete your initial application information',
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
      
      res.status(201).json({
        application,
        nextQuestions,
      });
    } catch (error: any) {
      console.error('Error creating application:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  }
  
  /**
   * Get application by ID
   */
  async getApplication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const application = await firestoreService.getApplication(id);
      
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      
      res.json(application);
    } catch (error: any) {
      console.error('Error getting application:', error);
      res.status(500).json({ error: 'Failed to get application' });
    }
  }
  
  /**
   * Get next questions for an application
   */
  async getNextQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 3;
      
      const application = await firestoreService.getApplication(id);
      
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      
      const allQuestions = questionRepository.getAll();
      const nextQuestions = questionSelectionEngine.selectNextQuestions(
        application,
        allQuestions,
        limit
      );
      
      res.json({
        questions: nextQuestions,
        underwritingReadiness: application.underwritingReadiness,
        riskScore: application.riskScore,
      });
    } catch (error: any) {
      console.error('Error getting next questions:', error);
      res.status(500).json({ error: 'Failed to get next questions' });
    }
  }
  
  /**
   * Submit answer to a question
   */
  async submitAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { questionId, value, answeredBy } = req.body;
      
      if (!questionId || value === undefined || !answeredBy) {
        res.status(400).json({ error: 'questionId, value, and answeredBy are required' });
        return;
      }
      
      const application = await firestoreService.getApplication(id);
      
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      
      // Update responses
      application.responses[questionId] = {
        questionId,
        value,
        answeredBy,
        answeredAt: new Date(),
      };
      
      // Update completed questions
      if (!application.completedQuestions.includes(questionId)) {
        application.completedQuestions.push(questionId);
      }
      
      // Recalculate scores
      const allQuestions = questionRepository.getAll();
      application.underwritingReadiness = questionSelectionEngine.calculateUnderwritingReadiness(
        application,
        allQuestions
      );
      application.riskScore = questionSelectionEngine.calculateRiskScore(
        application,
        allQuestions
      );
      
      // Get next questions
      const nextQuestions = questionSelectionEngine.selectNextQuestions(
        application,
        allQuestions,
        3
      );
      application.nextQuestions = nextQuestions.map(q => q.id);
      
      // Check if stage should advance
      if (application.underwritingReadiness > 0.8 && application.currentStage === ApplicationStage.BASIC_INFO) {
        application.currentStage = ApplicationStage.BUSINESS_DETAILS;
        application.status = ApplicationStatus.IN_PROGRESS;
      }
      
      // Update in Firestore
      await firestoreService.updateApplication(id, {
        responses: application.responses,
        completedQuestions: application.completedQuestions,
        underwritingReadiness: application.underwritingReadiness,
        riskScore: application.riskScore,
        nextQuestions: application.nextQuestions,
        currentStage: application.currentStage,
        status: application.status,
      });
      
      // Log audit
      await firestoreService.logAudit({
        applicationId: id,
        action: AuditAction.QUESTION_ANSWERED,
        userId: answeredBy,
        details: { questionId, value },
      });
      
      res.json({
        success: true,
        application: {
          id: application.id,
          status: application.status,
          currentStage: application.currentStage,
          underwritingReadiness: application.underwritingReadiness,
          riskScore: application.riskScore,
        },
        nextQuestions,
      });
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ error: 'Failed to submit answer' });
    }
  }
  
  /**
   * Update application status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, userId } = req.body;
      
      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }
      
      const application = await firestoreService.getApplication(id);
      
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      
      await firestoreService.updateApplication(id, { status });
      
      // Log audit
      await firestoreService.logAudit({
        applicationId: id,
        action: AuditAction.STATUS_CHANGED,
        userId: userId || 'system',
        details: { oldStatus: application.status, newStatus: status },
      });
      
      // Notify via GoHighLevel
      try {
        await goHighLevelService.notifyApplicationStatus({
          email: application.applicantEmail,
          businessName: application.businessName,
          status,
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
      
      res.json({ success: true, status });
    } catch (error: any) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
  
  /**
   * Trigger workflow
   */
  async triggerWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { workflowType } = req.body;
      
      const application = await firestoreService.getApplication(id);
      
      if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }
      
      let result;
      
      switch (workflowType) {
        case 'credit_check':
          result = await n8nService.triggerCreditCheck(application);
          break;
        case 'underwriting_review':
          result = await n8nService.triggerUnderwritingReview(application);
          break;
        case 'document_collection':
          const docs = req.body.documents || [];
          result = await n8nService.triggerDocumentCollection(application, docs);
          break;
        case 'compliance_check':
          result = await n8nService.triggerComplianceCheck(application);
          break;
        default:
          res.status(400).json({ error: 'Invalid workflow type' });
          return;
      }
      
      // Log audit
      await firestoreService.logAudit({
        applicationId: id,
        action: AuditAction.WORKFLOW_TRIGGERED,
        userId: req.body.userId || 'system',
        details: { workflowType, result },
      });
      
      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error triggering workflow:', error);
      res.status(500).json({ error: 'Failed to trigger workflow' });
    }
  }
  
  /**
   * Get audit log
   */
  async getAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const auditLog = await firestoreService.getAuditLog(id);
      
      res.json({ auditLog });
    } catch (error: any) {
      console.error('Error getting audit log:', error);
      res.status(500).json({ error: 'Failed to get audit log' });
    }
  }
  
  /**
   * List applications
   */
  async listApplications(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        email: req.query.email as string,
        limit: parseInt(req.query.limit as string) || 50,
      };
      
      const applications = await firestoreService.listApplications(filters);
      
      res.json({ applications });
    } catch (error: any) {
      console.error('Error listing applications:', error);
      res.status(500).json({ error: 'Failed to list applications' });
    }
  }
}

export const applicationController = new ApplicationController();
