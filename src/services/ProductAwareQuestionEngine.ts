/**
 * Product-Aware Agentic Question Selection Engine
 * 
 * Selects next best questions/actions based on:
 * - Underwriting outcome dimensions
 * - Product-specific requirements
 * - Value of information for each outcome
 * - Current confidence levels
 */

import {
  Application,
  NextBestAction,
  OutcomeDimension,
  LoanProductType,
  UnderwritingOutcomeScores,
  MissingInformation
} from '../models/CanonicalEntities';
import { Question, QuestionCategory } from '../models/Question';

export class ProductAwareQuestionEngine {
  /**
   * Determine the next best actions for an application
   */
  selectNextBestActions(
    application: Application,
    availableQuestions: Question[],
    outcomeScores: UnderwritingOutcomeScores,
    maxActions: number = 3
  ): NextBestAction[] {
    
    const actions: NextBestAction[] = [];
    
    // Collect all missing information across dimensions
    const allMissing = this.aggregateMissingInformation(outcomeScores);
    
    // Prioritize by blocking status and value
    const prioritized = allMissing.sort((a, b) => {
      // Blocking items first
      if (a.blocksUnderwriting && !b.blocksUnderwriting) return -1;
      if (!a.blocksUnderwriting && b.blocksUnderwriting) return 1;
      
      // Then by priority
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by value of information
      return b.estimatedValueOfInformation - a.estimatedValueOfInformation;
    });
    
    // Convert missing information to actions
    for (const missing of prioritized) {
      if (actions.length >= maxActions) break;
      
      if (missing.informationType === 'QUESTION' && missing.questionId) {
        const question = availableQuestions.find(q => q.id === missing.questionId);
        if (question && !application.completedQuestions?.includes(question.id)) {
          actions.push({
            actionType: 'ASK_QUESTION',
            priority: this.priorityToNumber(missing.priority),
            questionId: question.id,
            reason: this.explainQuestionValue(question, missing),
            estimatedValueOfInformation: missing.estimatedValueOfInformation,
            blocksUnderwriting: missing.blocksUnderwriting
          });
        }
      } else if (missing.informationType === 'DOCUMENT' && missing.documentType) {
        actions.push({
          actionType: 'REQUEST_DOCUMENT',
          priority: this.priorityToNumber(missing.priority),
          documentType: missing.documentType,
          documentPurpose: this.explainDocumentPurpose(missing.documentType, application.productType),
          reason: `Required for ${application.productType} underwriting`,
          estimatedValueOfInformation: missing.estimatedValueOfInformation,
          blocksUnderwriting: missing.blocksUnderwriting
        });
      } else if (missing.informationType === 'VERIFICATION') {
        actions.push({
          actionType: 'VERIFY_DATA',
          priority: this.priorityToNumber(missing.priority),
          reason: 'Identity or data verification needed',
          estimatedValueOfInformation: missing.estimatedValueOfInformation,
          blocksUnderwriting: missing.blocksUnderwriting
        });
      }
    }
    
    // Add product discovery if product type is unsure
    if (application.productType === LoanProductType.UNSURE && actions.length < maxActions) {
      actions.unshift({
        actionType: 'ASK_QUESTION',
        priority: 10,
        questionId: 'q_product_discovery',
        reason: 'Determine the best loan product for applicant needs',
        estimatedValueOfInformation: 100,
        blocksUnderwriting: true
      });
    }
    
    // Check for escalation needs
    if (this.shouldEscalate(outcomeScores)) {
      actions.push({
        actionType: 'ESCALATE',
        priority: 9,
        reason: this.getEscalationReason(outcomeScores),
        estimatedValueOfInformation: 0,
        blocksUnderwriting: true
      });
    }
    
    return actions.slice(0, maxActions);
  }
  
  /**
   * Select questions that address specific outcome dimension
   */
  selectQuestionsForOutcome(
    outcome: OutcomeDimension,
    availableQuestions: Question[],
    completedQuestionIds: string[]
  ): Question[] {
    
    const relevantCategories = this.getRelevantCategories(outcome);
    
    return availableQuestions
      .filter(q => !completedQuestionIds.includes(q.id))
      .filter(q => relevantCategories.includes(q.category))
      .sort((a, b) => {
        // Sort by underwriting weight and information value
        const scoreA = a.underwritingWeight * a.informationValue;
        const scoreB = b.underwritingWeight * b.informationValue;
        return scoreB - scoreA;
      });
  }
  
  /**
   * Determine if product type affects question priority
   */
  adjustQuestionPriorityByProduct(
    question: Question,
    productType: LoanProductType
  ): number {
    let adjustment = 0;
    
    switch (productType) {
      case LoanProductType.SBA_LOAN:
        // SBA requires detailed financials and business history
        if (['FINANCIAL_METRICS', 'BUSINESS_STRUCTURE', 'OWNER_INFO'].includes(question.category)) {
          adjustment += 2;
        }
        break;
        
      case LoanProductType.EQUIPMENT_FINANCING:
        // Equipment financing focuses on collateral
        if (['COLLATERAL', 'USE_OF_FUNDS'].includes(question.category)) {
          adjustment += 3;
        }
        break;
        
      case LoanProductType.INVOICE_FINANCING:
      case LoanProductType.INVOICE_FACTORING:
        // Invoice-based products care about AR and customers
        if (['FINANCIAL_METRICS'].includes(question.category)) {
          adjustment += 2;
        }
        break;
        
      case LoanProductType.LINE_OF_CREDIT:
        // Lines of credit focus on cashflow
        if (['FINANCIAL_METRICS', 'CREDIT_HISTORY'].includes(question.category)) {
          adjustment += 2;
        }
        break;
        
      case LoanProductType.MCA:
        // MCA is simpler, focuses on revenue
        if (['FINANCIAL_METRICS'].includes(question.category)) {
          adjustment += 1;
        }
        // Less emphasis on detailed structure
        if (['BUSINESS_STRUCTURE', 'COMPLIANCE'].includes(question.category)) {
          adjustment -= 1;
        }
        break;
    }
    
    return adjustment;
  }
  
  /**
   * Aggregate all missing information across outcome dimensions
   */
  private aggregateMissingInformation(
    outcomeScores: UnderwritingOutcomeScores
  ): MissingInformation[] {
    const all: MissingInformation[] = [];
    
    all.push(...outcomeScores.identityConfidence.missingInformation);
    all.push(...outcomeScores.operationalStability.missingInformation);
    all.push(...outcomeScores.cashflowStrength.missingInformation);
    all.push(...outcomeScores.debtBurden.missingInformation);
    all.push(...outcomeScores.fraudRisk.missingInformation);
    all.push(...outcomeScores.documentationReadiness.missingInformation);
    
    // Deduplicate by question ID or document type
    const seen = new Set<string>();
    return all.filter(item => {
      const key = item.questionId || item.documentType || 'verification';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Get question categories relevant to an outcome dimension
   */
  private getRelevantCategories(outcome: OutcomeDimension): QuestionCategory[] {
    switch (outcome) {
      case OutcomeDimension.IDENTITY_CONFIDENCE:
        return [QuestionCategory.BASIC_INFO, QuestionCategory.OWNER_INFO, QuestionCategory.COMPLIANCE];
      
      case OutcomeDimension.OPERATIONAL_STABILITY:
        return [QuestionCategory.BASIC_INFO, QuestionCategory.BUSINESS_STRUCTURE, QuestionCategory.FINANCIAL_METRICS];
      
      case OutcomeDimension.CASHFLOW_STRENGTH:
        return [QuestionCategory.FINANCIAL_METRICS, QuestionCategory.USE_OF_FUNDS];
      
      case OutcomeDimension.DEBT_BURDEN:
        return [QuestionCategory.FINANCIAL_METRICS, QuestionCategory.CREDIT_HISTORY];
      
      case OutcomeDimension.FRAUD_RISK:
        return [QuestionCategory.COMPLIANCE, QuestionCategory.OWNER_INFO];
      
      case OutcomeDimension.DOCUMENTATION_READINESS:
        return []; // Handled by document requests
      
      default:
        return [];
    }
  }
  
  /**
   * Explain why a question is valuable
   */
  private explainQuestionValue(question: Question, missing: MissingInformation): string {
    const reasons: string[] = [];
    
    if (missing.blocksUnderwriting) {
      reasons.push('Required for underwriting decision');
    }
    
    if (question.underwritingWeight >= 8) {
      reasons.push('Critical for underwriting assessment');
    }
    
    if (question.riskImpact.weight >= 7) {
      reasons.push(`Significant impact on ${question.riskImpact.dimension.toLowerCase().replace(/_/g, ' ')}`);
    }
    
    reasons.push(`Addresses ${question.category.toLowerCase().replace(/_/g, ' ')}`);
    
    return reasons.join('. ');
  }
  
  /**
   * Explain document purpose by type and product
   */
  private explainDocumentPurpose(documentType: any, productType: LoanProductType): string {
    const purposes: Record<string, string> = {
      'TAX_RETURN': 'Verify business revenue and tax compliance',
      'BANK_STATEMENT': 'Assess cashflow and banking activity',
      'PROFIT_LOSS_STATEMENT': 'Evaluate profitability and operations',
      'BALANCE_SHEET': 'Understand assets, liabilities, and equity',
      'ACCOUNTS_RECEIVABLE_AGING': 'Assess quality of receivables for lending',
      'EQUIPMENT_APPRAISAL': 'Determine collateral value',
      'DRIVERS_LICENSE': 'Verify owner identity',
      'ARTICLES_OF_INCORPORATION': 'Confirm business legal structure'
    };
    
    let purpose = purposes[documentType] || 'Required documentation';
    
    // Add product-specific context
    if (productType === LoanProductType.INVOICE_FINANCING && documentType === 'ACCOUNTS_RECEIVABLE_AGING') {
      purpose += ' (critical for invoice financing eligibility)';
    } else if (productType === LoanProductType.EQUIPMENT_FINANCING && documentType === 'EQUIPMENT_APPRAISAL') {
      purpose += ' (required for equipment financing)';
    }
    
    return purpose;
  }
  
  /**
   * Check if application should be escalated to human review
   */
  private shouldEscalate(outcomeScores: UnderwritingOutcomeScores): boolean {
    // Escalate if any critical dimension is below threshold with low confidence
    const criticalDimensions = [
      outcomeScores.identityConfidence,
      outcomeScores.fraudRisk,
      outcomeScores.cashflowStrength
    ];
    
    for (const dimension of criticalDimensions) {
      if (!dimension.isAboveThreshold && dimension.confidence.score < 0.5) {
        return true;
      }
    }
    
    // Escalate if fraud risk is high (score is low since lower = more risk)
    if (outcomeScores.fraudRisk.score < 30) {
      return true;
    }
    
    // Escalate if overall score is very low
    if (outcomeScores.overallScore < 40) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get reason for escalation
   */
  private getEscalationReason(outcomeScores: UnderwritingOutcomeScores): string {
    const reasons: string[] = [];
    
    if (outcomeScores.identityConfidence.score < 50) {
      reasons.push('Low identity confidence');
    }
    
    if (outcomeScores.fraudRisk.score < 30) {
      reasons.push('Fraud indicators detected');
    }
    
    if (outcomeScores.cashflowStrength.score < 40) {
      reasons.push('Weak cashflow position');
    }
    
    if (outcomeScores.overallScore < 40) {
      reasons.push('Overall underwriting score below threshold');
    }
    
    if (reasons.length === 0) {
      reasons.push('Multiple low-confidence data points');
    }
    
    return `Human review required: ${reasons.join(', ')}`;
  }
  
  /**
   * Convert priority enum to number
   */
  private priorityToNumber(priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (priority) {
      case 'CRITICAL': return 10;
      case 'HIGH': return 8;
      case 'MEDIUM': return 5;
      case 'LOW': return 3;
    }
  }
}

export const productAwareQuestionEngine = new ProductAwareQuestionEngine();
