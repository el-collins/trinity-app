import { Question, QuestionSelectionContext, QuestionCategory } from '../models/Question';
import { ApplicationState } from '../models/Application';

export class QuestionSelectionEngine {
  /**
   * Selects the next best questions based on information value and application state
   */
  selectNextQuestions(
    application: ApplicationState,
    availableQuestions: Question[],
    maxQuestions: number = 3
  ): Question[] {
    const context: QuestionSelectionContext = {
      applicationState: application,
      availableQuestions,
      informationGaps: this.identifyInformationGaps(application),
      priorityAreas: this.identifyPriorityAreas(application),
    };
    
    // Filter out already answered questions
    const unansweredQuestions = availableQuestions.filter(
      q => !application.completedQuestions.includes(q.id)
    );
    
    // Filter by prerequisites
    const eligibleQuestions = unansweredQuestions.filter(q =>
      this.checkPrerequisites(q, application)
    );
    
    // Filter by current stage
    const stageRelevantQuestions = eligibleQuestions.filter(q =>
      q.applicableStages.includes(application.currentStage)
    );
    
    // Calculate adjusted information value for each question
    const scoredQuestions = stageRelevantQuestions.map(q => ({
      question: q,
      score: this.calculateQuestionScore(q, context),
    }));
    
    // Sort by score descending
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    // Return top N questions
    return scoredQuestions.slice(0, maxQuestions).map(sq => sq.question);
  }
  
  /**
   * Calculate a composite score for question selection
   */
  private calculateQuestionScore(
    question: Question,
    context: QuestionSelectionContext
  ): number {
    let score = question.informationValue;
    
    // Boost score if question fills information gap
    if (context.informationGaps.some(gap => question.category === gap)) {
      score *= 1.5;
    }
    
    // Boost score if in priority area
    if (context.priorityAreas.includes(question.category)) {
      score *= 1.3;
    }
    
    // Boost score based on underwriting weight
    score *= (1 + question.underwritingWeight / 10);
    
    // Boost score based on risk impact
    score *= (1 + Math.abs(question.riskImpact.weight) / 5);
    
    // Reduce score if question has many unanswered dependencies
    const unansweredDeps = (question.dependsOn || []).filter(
      depId => !context.applicationState.completedQuestions.includes(depId)
    ).length;
    
    if (unansweredDeps > 0) {
      score *= Math.pow(0.7, unansweredDeps);
    }
    
    return score;
  }
  
  /**
   * Check if all prerequisites for a question are met
   */
  private checkPrerequisites(question: Question, application: ApplicationState): boolean {
    if (!question.prerequisites || question.prerequisites.length === 0) {
      return true;
    }
    
    return question.prerequisites.every(prereq => {
      const response = application.responses[prereq.questionId];
      
      if (!response) {
        return prereq.operator === 'NOT_EXISTS';
      }
      
      switch (prereq.operator) {
        case 'EXISTS':
          return true;
        case 'EQUALS':
          return response.value === prereq.value;
        case 'NOT_EQUALS':
          return response.value !== prereq.value;
        case 'GREATER_THAN':
          return response.value > prereq.value;
        case 'LESS_THAN':
          return response.value < prereq.value;
        case 'IN':
          return Array.isArray(prereq.value) && prereq.value.includes(response.value);
        case 'NOT_IN':
          return Array.isArray(prereq.value) && !prereq.value.includes(response.value);
        default:
          return false;
      }
    });
  }
  
  /**
   * Identify information gaps that need to be filled
   */
  private identifyInformationGaps(application: ApplicationState): string[] {
    const gaps: string[] = [];
    const responses = application.responses;
    
    // Check for missing categories based on stage
    const categoryResponses: Record<string, number> = {};
    
    Object.values(responses).forEach(response => {
      // This is a simplified version - in production, you'd track categories per response
      const category = 'BASIC_INFO'; // Would be derived from question metadata
      categoryResponses[category] = (categoryResponses[category] || 0) + 1;
    });
    
    // Identify categories with insufficient information
    Object.values(QuestionCategory).forEach(category => {
      if (!categoryResponses[category] || categoryResponses[category] < 2) {
        gaps.push(category);
      }
    });
    
    return gaps;
  }
  
  /**
   * Identify priority areas based on risk and underwriting needs
   */
  private identifyPriorityAreas(application: ApplicationState): QuestionCategory[] {
    const priorities: QuestionCategory[] = [];
    
    // Always prioritize based on current stage
    switch (application.currentStage) {
      case 'BASIC_INFO':
        priorities.push(QuestionCategory.BASIC_INFO, QuestionCategory.BUSINESS_STRUCTURE);
        break;
      case 'BUSINESS_DETAILS':
        priorities.push(QuestionCategory.BUSINESS_STRUCTURE, QuestionCategory.OWNER_INFO);
        break;
      case 'FINANCIAL_INFO':
        priorities.push(QuestionCategory.FINANCIAL_METRICS, QuestionCategory.USE_OF_FUNDS);
        break;
      case 'CREDIT_CHECK':
        priorities.push(QuestionCategory.CREDIT_HISTORY, QuestionCategory.COLLATERAL);
        break;
      case 'DOCUMENT_COLLECTION':
        priorities.push(QuestionCategory.COMPLIANCE);
        break;
      default:
        priorities.push(QuestionCategory.BASIC_INFO);
    }
    
    // If underwriting readiness is low, prioritize high-weight categories
    if (application.underwritingReadiness < 0.5) {
      priorities.push(QuestionCategory.FINANCIAL_METRICS, QuestionCategory.CREDIT_HISTORY);
    }
    
    return priorities;
  }
  
  /**
   * Calculate underwriting readiness score (0-1)
   */
  calculateUnderwritingReadiness(
    application: ApplicationState,
    allQuestions: Question[]
  ): number {
    const criticalQuestions = allQuestions.filter(q => q.underwritingWeight >= 8);
    const answeredCritical = criticalQuestions.filter(q =>
      application.completedQuestions.includes(q.id)
    );
    
    if (criticalQuestions.length === 0) {
      return 0;
    }
    
    const criticalScore = answeredCritical.length / criticalQuestions.length;
    
    // Also factor in total coverage
    const totalScore = application.completedQuestions.length / allQuestions.length;
    
    // Weighted average: 70% critical, 30% total
    return criticalScore * 0.7 + totalScore * 0.3;
  }
  
  /**
   * Calculate risk score based on responses
   */
  calculateRiskScore(application: ApplicationState, allQuestions: Question[]): number {
    let totalRiskWeight = 0;
    let weightedRiskSum = 0;
    
    Object.entries(application.responses).forEach(([questionId, response]) => {
      const question = allQuestions.find(q => q.id === questionId);
      
      if (question && question.riskImpact) {
        const impact = question.riskImpact;
        const weight = impact.weight;
        
        // Simplified risk calculation - in production, this would be more sophisticated
        let riskContribution = weight;
        
        if (impact.direction === 'NEGATIVE') {
          riskContribution *= -1;
        } else if (impact.direction === 'NEUTRAL') {
          riskContribution = 0;
        }
        
        totalRiskWeight += Math.abs(weight);
        weightedRiskSum += riskContribution;
      }
    });
    
    if (totalRiskWeight === 0) {
      return 50; // Neutral score
    }
    
    // Normalize to 0-100 scale
    const normalizedScore = 50 + (weightedRiskSum / totalRiskWeight) * 50;
    return Math.max(0, Math.min(100, normalizedScore));
  }
}

export const questionSelectionEngine = new QuestionSelectionEngine();
