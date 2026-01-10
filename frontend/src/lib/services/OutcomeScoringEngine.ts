/**
 * Outcome-Based Scoring Engine
 * 
 * Calculates underwriting outcome dimensions based on collected evidence and facts
 */

import {
  Application,
  UnderwritingOutcomeScores,
  OutcomeScore,
  OutcomeDimension,
  ConfidenceScore,
  ConfidenceLevel,
  ContributingFactor,
  MissingInformation,
  Evidence,
  FinancialSnapshot,
  DebtSummary,
  Owner,
  Business,
  LoanProductType
} from '../types/CanonicalEntities';

export class OutcomeScoringEngine {
  /**
   * Calculate all outcome dimensions for an application
   */
  calculateOutcomeScores(
    application: Application,
    business: Business,
    owners: Owner[],
    financials: FinancialSnapshot[],
    debts: DebtSummary[],
    evidence: Evidence[]
  ): UnderwritingOutcomeScores {
    
    const identityConfidence = this.calculateIdentityConfidence(business, owners, evidence);
    const operationalStability = this.calculateOperationalStability(business, financials);
    const cashflowStrength = this.calculateCashflowStrength(financials, application);
    const debtBurden = this.calculateDebtBurden(financials, debts);
    const fraudRisk = this.calculateFraudRisk(business, owners, evidence, financials);
    const documentationReadiness = this.calculateDocumentationReadiness(
      application,
      evidence,
      application.productType
    );
    
    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore({
      identityConfidence,
      operationalStability,
      cashflowStrength,
      debtBurden,
      fraudRisk,
      documentationReadiness
    });
    
    return {
      identityConfidence,
      operationalStability,
      cashflowStrength,
      debtBurden,
      fraudRisk,
      documentationReadiness,
      overallScore,
      lastCalculatedAt: new Date()
    };
  }
  
  /**
   * Identity Confidence: How confident are we in the identity of the business and owners?
   */
  private calculateIdentityConfidence(
    business: Business,
    owners: Owner[],
    evidence: Evidence[]
  ): OutcomeScore {
    const factors: ContributingFactor[] = [];
    const missing: MissingInformation[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    
    // Business identity
    if (business.ein) {
      factors.push({
        factorId: 'business_ein',
        factorType: 'QUESTION_ANSWER',
        description: 'EIN provided',
        impact: 20,
        confidence: business.identityConfidence.score
      });
      totalScore += 20 * business.identityConfidence.score;
      totalWeight += 20;
    } else {
      missing.push({
        informationType: 'QUESTION',
        questionId: 'q_ein',
        priority: 'CRITICAL',
        blocksUnderwriting: true,
        estimatedValueOfInformation: 20
      });
    }
    
    // Business identity documents
    const businessDocs = evidence.filter(e => 
      ['EIN_LETTER', 'ARTICLES_OF_INCORPORATION', 'BUSINESS_LICENSE'].includes(e.documentType)
    );
    if (businessDocs.length > 0) {
      const avgConfidence = businessDocs.reduce((sum, d) => 
        sum + (d.extractionConfidence || 0.5), 0
      ) / businessDocs.length;
      
      factors.push({
        factorId: 'business_docs',
        factorType: 'DOCUMENT',
        description: `${businessDocs.length} business identity document(s)`,
        impact: 15,
        confidence: avgConfidence
      });
      totalScore += 15 * avgConfidence;
      totalWeight += 15;
    } else {
      missing.push({
        informationType: 'DOCUMENT',
        documentType: 'ARTICLES_OF_INCORPORATION' as any,
        priority: 'HIGH',
        blocksUnderwriting: false,
        estimatedValueOfInformation: 15
      });
    }
    
    // Owner identity
    const verifiedOwners = owners.filter(o => o.identityConfidence.score > 0.7);
    const ownerVerificationRate = owners.length > 0 ? verifiedOwners.length / owners.length : 0;
    
    if (owners.length > 0) {
      factors.push({
        factorId: 'owner_identity',
        factorType: 'CALCULATED',
        description: `${verifiedOwners.length}/${owners.length} owners verified`,
        impact: 25,
        confidence: ownerVerificationRate
      });
      totalScore += 25 * ownerVerificationRate;
      totalWeight += 25;
    }
    
    owners.forEach(owner => {
      if (owner.identityConfidence.score < 0.7) {
        missing.push({
          informationType: 'VERIFICATION',
          priority: owner.isPrimary ? 'CRITICAL' : 'HIGH',
          blocksUnderwriting: owner.isPrimary,
          estimatedValueOfInformation: 10
        });
      }
    });
    
    // Owner identity documents
    const ownerDocs = evidence.filter(e => 
      ['DRIVERS_LICENSE', 'PASSPORT'].includes(e.documentType)
    );
    if (ownerDocs.length >= owners.length) {
      factors.push({
        factorId: 'owner_docs',
        factorType: 'DOCUMENT',
        description: 'All owners have identity documents',
        impact: 20,
        confidence: 0.9
      });
      totalScore += 20 * 0.9;
      totalWeight += 20;
    }
    
    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
    const confidence = this.scoreToConfidence(finalScore, missing.length);
    
    return {
      dimension: OutcomeDimension.IDENTITY_CONFIDENCE,
      score: finalScore,
      confidence,
      contributingFactors: factors,
      missingInformation: missing,
      isAboveThreshold: finalScore >= 70,
      thresholdValue: 70,
      lastUpdatedAt: new Date()
    };
  }
  
  /**
   * Operational Stability: How stable and established is the business?
   */
  private calculateOperationalStability(
    business: Business,
    financials: FinancialSnapshot[]
  ): OutcomeScore {
    const factors: ContributingFactor[] = [];
    const missing: MissingInformation[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    
    // Years in business
    if (business.yearsInBusiness !== undefined) {
      const score = Math.min(business.yearsInBusiness * 10, 40); // Cap at 40 points for 4+ years
      factors.push({
        factorId: 'years_in_business',
        factorType: 'QUESTION_ANSWER',
        description: `${business.yearsInBusiness} years in business`,
        impact: score,
        confidence: 0.9
      });
      totalScore += score * 0.9;
      totalWeight += 40;
    } else {
      missing.push({
        informationType: 'QUESTION',
        questionId: 'q_years_in_business',
        priority: 'CRITICAL',
        blocksUnderwriting: true,
        estimatedValueOfInformation: 40
      });
    }
    
    // Revenue consistency (if we have multiple periods)
    if (financials.length >= 3) {
      const revenues = financials
        .filter(f => f.revenue !== undefined)
        .map(f => f.revenue!);
      
      if (revenues.length >= 3) {
        const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
        const variance = revenues.reduce((sum, r) => 
          sum + Math.pow(r - avgRevenue, 2), 0
        ) / revenues.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = avgRevenue > 0 ? stdDev / avgRevenue : 1;
        
        // Lower variation = more stable
        const consistencyScore = Math.max(0, 30 * (1 - coefficientOfVariation));
        
        factors.push({
          factorId: 'revenue_consistency',
          factorType: 'CALCULATED',
          description: 'Revenue consistency across periods',
          impact: consistencyScore,
          confidence: 0.8
        });
        totalScore += consistencyScore * 0.8;
        totalWeight += 30;
      }
    } else {
      missing.push({
        informationType: 'DOCUMENT',
        documentType: 'BANK_STATEMENT' as any,
        priority: 'HIGH',
        blocksUnderwriting: false,
        estimatedValueOfInformation: 30
      });
    }
    
    // Operational stability score from business
    if (business.operationalStabilityScore) {
      factors.push({
        factorId: 'operational_score',
        factorType: 'CALCULATED',
        description: 'Operational stability assessment',
        impact: 30,
        confidence: 0.7
      });
      totalScore += business.operationalStabilityScore.score * 0.3 * 0.7;
      totalWeight += 30;
    }
    
    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    const confidence = this.scoreToConfidence(finalScore, missing.length);
    
    return {
      dimension: OutcomeDimension.OPERATIONAL_STABILITY,
      score: finalScore,
      confidence,
      contributingFactors: factors,
      missingInformation: missing,
      isAboveThreshold: finalScore >= 60,
      thresholdValue: 60,
      lastUpdatedAt: new Date()
    };
  }
  
  /**
   * Cashflow Strength: How strong is the business's cashflow?
   */
  private calculateCashflowStrength(
    financials: FinancialSnapshot[],
    application: Application
  ): OutcomeScore {
    const factors: ContributingFactor[] = [];
    const missing: MissingInformation[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    
    // Recent cashflow data
    const recentFinancials = financials
      .filter(f => f.cashflowFromOperations !== undefined)
      .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())
      .slice(0, 3);
    
    if (recentFinancials.length > 0) {
      const avgCashflow = recentFinancials.reduce((sum, f) => 
        sum + f.cashflowFromOperations!, 0
      ) / recentFinancials.length;
      
      // Positive cashflow is good
      let cashflowScore = 0;
      if (avgCashflow > 0) {
        // Normalize to requested amount
        const cashflowRatio = application.requestedAmount 
          ? avgCashflow / (application.requestedAmount / 12) // Monthly comparison
          : 1;
        
        cashflowScore = Math.min(50, cashflowRatio * 25); // Cap at 50
      }
      
      factors.push({
        factorId: 'cashflow_operations',
        factorType: 'DOCUMENT',
        description: `Average cashflow: $${avgCashflow.toFixed(0)}`,
        impact: cashflowScore,
        confidence: 0.85
      });
      totalScore += cashflowScore * 0.85;
      totalWeight += 50;
    } else {
      missing.push({
        informationType: 'DOCUMENT',
        documentType: 'BANK_STATEMENT' as any,
        priority: 'CRITICAL',
        blocksUnderwriting: true,
        estimatedValueOfInformation: 50
      });
    }
    
    // Revenue to requested amount ratio
    const recentRevenue = financials
      .filter(f => f.revenue !== undefined && f.periodType === 'ANNUAL')
      .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];
    
    if (recentRevenue && application.requestedAmount) {
      const revenueRatio = recentRevenue.revenue! / application.requestedAmount;
      const revenueScore = Math.min(30, revenueRatio * 10);
      
      factors.push({
        factorId: 'revenue_to_loan',
        factorType: 'CALCULATED',
        description: 'Revenue relative to loan amount',
        impact: revenueScore,
        confidence: 0.8
      });
      totalScore += revenueScore * 0.8;
      totalWeight += 30;
    }
    
    // Bank balance
    const avgBankBalance = recentFinancials
      .filter(f => f.averageBankBalance !== undefined)
      .reduce((sum, f) => sum + f.averageBankBalance!, 0) / recentFinancials.length;
    
    if (avgBankBalance > 0) {
      const balanceScore = Math.min(20, (avgBankBalance / 10000) * 5);
      
      factors.push({
        factorId: 'bank_balance',
        factorType: 'DOCUMENT',
        description: `Average bank balance: $${avgBankBalance.toFixed(0)}`,
        impact: balanceScore,
        confidence: 0.9
      });
      totalScore += balanceScore * 0.9;
      totalWeight += 20;
    }
    
    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    const confidence = this.scoreToConfidence(finalScore, missing.length);
    
    return {
      dimension: OutcomeDimension.CASHFLOW_STRENGTH,
      score: finalScore,
      confidence,
      contributingFactors: factors,
      missingInformation: missing,
      isAboveThreshold: finalScore >= 65,
      thresholdValue: 65,
      lastUpdatedAt: new Date()
    };
  }
  
  /**
   * Debt Burden: How manageable is the business's debt?
   */
  private calculateDebtBurden(
    financials: FinancialSnapshot[],
    debts: DebtSummary[]
  ): OutcomeScore {
    const factors: ContributingFactor[] = [];
    const missing: MissingInformation[] = [];
    let totalScore = 50; // Start at neutral
    let totalWeight = 0;
    
    const recentDebt = debts.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    )[0];
    
    if (recentDebt) {
      // Debt service coverage ratio
      if (recentDebt.debtServiceCoverageRatio !== undefined) {
        const dscr = recentDebt.debtServiceCoverageRatio;
        let dscrScore = 0;
        
        if (dscr >= 1.5) dscrScore = 40; // Excellent
        else if (dscr >= 1.25) dscrScore = 30; // Good
        else if (dscr >= 1.0) dscrScore = 15; // Acceptable
        else dscrScore = -20; // Concerning
        
        factors.push({
          factorId: 'dscr',
          factorType: 'CALCULATED',
          description: `DSCR: ${dscr.toFixed(2)}`,
          impact: dscrScore,
          confidence: 0.85
        });
        totalScore += dscrScore * 0.85;
        totalWeight += 40;
      }
      
      // Total debt to revenue
      const recentRevenue = financials
        .filter(f => f.revenue !== undefined && f.periodType === 'ANNUAL')
        .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];
      
      if (recentRevenue && recentRevenue.revenue) {
        const debtToRevenue = recentDebt.totalOutstandingDebt / recentRevenue.revenue;
        let debtScore = 0;
        
        if (debtToRevenue < 0.3) debtScore = 30; // Low debt
        else if (debtToRevenue < 0.5) debtScore = 20; // Moderate
        else if (debtToRevenue < 0.8) debtScore = 5; // High
        else debtScore = -15; // Very high
        
        factors.push({
          factorId: 'debt_to_revenue',
          factorType: 'CALCULATED',
          description: `Debt/Revenue: ${(debtToRevenue * 100).toFixed(1)}%`,
          impact: debtScore,
          confidence: 0.8
        });
        totalScore += debtScore * 0.8;
        totalWeight += 30;
      }
      
      // Number and type of existing debts
      const highRiskDebtCount = recentDebt.debts.filter(d => 
        d.type === 'MERCHANT_CASH_ADVANCE'
      ).length;
      
      if (highRiskDebtCount > 0) {
        factors.push({
          factorId: 'high_risk_debt',
          factorType: 'CALCULATED',
          description: `${highRiskDebtCount} high-risk debt(s) (MCA)`,
          impact: -10 * highRiskDebtCount,
          confidence: 0.9
        });
        totalScore -= 10 * highRiskDebtCount * 0.9;
        totalWeight += 10 * highRiskDebtCount;
      }
    } else {
      missing.push({
        informationType: 'QUESTION',
        questionId: 'q_outstanding_debt',
        priority: 'HIGH',
        blocksUnderwriting: false,
        estimatedValueOfInformation: 30
      });
    }
    
    const finalScore = totalWeight > 0 ? ((totalScore / totalWeight) * 100) : 50;
    const normalizedScore = Math.max(0, Math.min(100, finalScore));
    const confidence = this.scoreToConfidence(normalizedScore, missing.length);
    
    return {
      dimension: OutcomeDimension.DEBT_BURDEN,
      score: normalizedScore,
      confidence,
      contributingFactors: factors,
      missingInformation: missing,
      isAboveThreshold: normalizedScore >= 60,
      thresholdValue: 60,
      lastUpdatedAt: new Date()
    };
  }
  
  /**
   * Fraud Risk: Are there indicators of fraud or inconsistency?
   */
  private calculateFraudRisk(
    business: Business,
    owners: Owner[],
    evidence: Evidence[],
    financials: FinancialSnapshot[]
  ): OutcomeScore {
    const factors: ContributingFactor[] = [];
    const missing: MissingInformation[] = [];
    let riskScore = 0; // Lower is better for risk
    
    // Data conflicts
    const conflictedEvidence = evidence.filter(e => e.hasConflicts);
    if (conflictedEvidence.length > 0) {
      factors.push({
        factorId: 'data_conflicts',
        factorType: 'CALCULATED',
        description: `${conflictedEvidence.length} document(s) with conflicts`,
        impact: -20 * conflictedEvidence.length,
        confidence: 0.9
      });
      riskScore += 20 * conflictedEvidence.length;
    }
    
    // Unverified documents
    const unverifiedDocs = evidence.filter(e => 
      e.verificationStatus === 'PENDING' || e.verificationStatus === 'NEEDS_CLARIFICATION'
    );
    if (unverifiedDocs.length > 2) {
      factors.push({
        factorId: 'unverified_docs',
        factorType: 'DOCUMENT',
        description: `${unverifiedDocs.length} unverified documents`,
        impact: -10,
        confidence: 0.7
      });
      riskScore += 10;
    }
    
    // Low confidence data sources
    const lowConfidenceData = [
      ...financials.filter(f => f.confidence.score < 0.5),
      ...evidence.filter(e => (e.extractionConfidence || 1) < 0.5)
    ];
    
    if (lowConfidenceData.length > 0) {
      factors.push({
        factorId: 'low_confidence_data',
        factorType: 'CALCULATED',
        description: `${lowConfidenceData.length} low-confidence data point(s)`,
        impact: -5 * lowConfidenceData.length,
        confidence: 0.6
      });
      riskScore += 5 * lowConfidenceData.length;
    }
    
    // Inconsistent owner information
    const ownersWithLowConfidence = owners.filter(o => o.identityConfidence.score < 0.5);
    if (ownersWithLowConfidence.length > 0) {
      factors.push({
        factorId: 'owner_identity_issues',
        factorType: 'CALCULATED',
        description: `${ownersWithLowConfidence.length} owner(s) with identity concerns`,
        impact: -15 * ownersWithLowConfidence.length,
        confidence: 0.8
      });
      riskScore += 15 * ownersWithLowConfidence.length;
    }
    
    // Convert risk score to confidence score (inverse)
    // Low risk = high score
    const finalScore = Math.max(0, Math.min(100, 100 - riskScore));
    const confidence = this.scoreToConfidence(finalScore, missing.length);
    
    return {
      dimension: OutcomeDimension.FRAUD_RISK,
      score: finalScore,
      confidence,
      contributingFactors: factors,
      missingInformation: missing,
      isAboveThreshold: finalScore >= 70, // Low fraud risk
      thresholdValue: 70,
      lastUpdatedAt: new Date()
    };
  }
  
  /**
   * Documentation Readiness: Do we have all required documents?
   */
  private calculateDocumentationReadiness(
    application: Application,
    evidence: Evidence[],
    productType: LoanProductType
  ): OutcomeScore {
    const factors: ContributingFactor[] = [];
    const missing: MissingInformation[] = [];
    
    // Get required documents for product type
    const requiredDocs = this.getRequiredDocuments(productType);
    const providedDocs = evidence.map(e => e.documentType);
    
    const missingDocs = requiredDocs.filter(req => !providedDocs.includes(req));
    const verifiedDocs = evidence.filter(e => e.verificationStatus === 'VERIFIED');
    
    // Calculate score
    const completionRate = requiredDocs.length > 0 
      ? (requiredDocs.length - missingDocs.length) / requiredDocs.length 
      : 0;
    const verificationRate = evidence.length > 0 
      ? verifiedDocs.length / evidence.length 
      : 0;
    
    const score = (completionRate * 60 + verificationRate * 40) * 100;
    
    factors.push({
      factorId: 'doc_completion',
      factorType: 'DOCUMENT',
      description: `${requiredDocs.length - missingDocs.length}/${requiredDocs.length} required documents`,
      impact: completionRate * 60,
      confidence: 0.95
    });
    
    factors.push({
      factorId: 'doc_verification',
      factorType: 'CALCULATED',
      description: `${verifiedDocs.length}/${evidence.length} documents verified`,
      impact: verificationRate * 40,
      confidence: 0.9
    });
    
    // Add missing documents
    missingDocs.forEach(docType => {
      missing.push({
        informationType: 'DOCUMENT',
        documentType: docType,
        priority: this.getDocumentPriority(docType),
        blocksUnderwriting: this.isDocumentCritical(docType),
        estimatedValueOfInformation: 15
      });
    });
    
    const confidence = this.scoreToConfidence(score, missingDocs.length);
    
    return {
      dimension: OutcomeDimension.DOCUMENTATION_READINESS,
      score,
      confidence,
      contributingFactors: factors,
      missingInformation: missing,
      isAboveThreshold: score >= 80,
      thresholdValue: 80,
      lastUpdatedAt: new Date()
    };
  }
  
  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(scores: Omit<UnderwritingOutcomeScores, 'overallScore' | 'lastCalculatedAt'>): number {
    const weights = {
      identityConfidence: 0.20,
      operationalStability: 0.15,
      cashflowStrength: 0.25,
      debtBurden: 0.20,
      fraudRisk: 0.10,
      documentationReadiness: 0.10
    };
    
    return (
      scores.identityConfidence.score * weights.identityConfidence +
      scores.operationalStability.score * weights.operationalStability +
      scores.cashflowStrength.score * weights.cashflowStrength +
      scores.debtBurden.score * weights.debtBurden +
      scores.fraudRisk.score * weights.fraudRisk +
      scores.documentationReadiness.score * weights.documentationReadiness
    );
  }
  
  /**
   * Convert numeric score to confidence level
   */
  private scoreToConfidence(score: number, missingCount: number): ConfidenceScore {
    let level: ConfidenceLevel;
    let confidenceScore = score / 100;
    
    // Reduce confidence based on missing information
    confidenceScore = confidenceScore * Math.pow(0.9, missingCount);
    
    if (confidenceScore >= 0.9) level = ConfidenceLevel.VERY_HIGH;
    else if (confidenceScore >= 0.7) level = ConfidenceLevel.HIGH;
    else if (confidenceScore >= 0.5) level = ConfidenceLevel.MEDIUM;
    else if (confidenceScore >= 0.3) level = ConfidenceLevel.LOW;
    else level = ConfidenceLevel.VERY_LOW;
    
    return {
      score: confidenceScore,
      level,
      factors: missingCount > 0 ? [`${missingCount} missing information items`] : ['Complete information'],
      lastUpdatedAt: new Date()
    };
  }
  
  /**
   * Get required documents for product type
   */
  private getRequiredDocuments(productType: LoanProductType): any[] {
    const baseDoc: any[] = ['TAX_RETURN', 'BANK_STATEMENT', 'DRIVERS_LICENSE'];
    
    switch (productType) {
      case LoanProductType.SBA_LOAN:
        return [...baseDoc, 'PROFIT_LOSS_STATEMENT', 'BALANCE_SHEET', 'ARTICLES_OF_INCORPORATION'];
      case LoanProductType.EQUIPMENT_FINANCING:
        return [...baseDoc, 'EQUIPMENT_APPRAISAL'];
      case LoanProductType.INVOICE_FINANCING:
      case LoanProductType.INVOICE_FACTORING:
        return [...baseDoc, 'ACCOUNTS_RECEIVABLE_AGING', 'INVOICE'];
      case LoanProductType.LINE_OF_CREDIT:
        return [...baseDoc, 'PROFIT_LOSS_STATEMENT'];
      case LoanProductType.MCA:
        return ['BANK_STATEMENT', 'DRIVERS_LICENSE'];
      default:
        return baseDoc;
    }
  }
  
  private getDocumentPriority(docType: any): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const critical = ['TAX_RETURN', 'BANK_STATEMENT', 'DRIVERS_LICENSE'];
    const high = ['PROFIT_LOSS_STATEMENT', 'BALANCE_SHEET', 'ARTICLES_OF_INCORPORATION'];
    
    if (critical.includes(docType)) return 'CRITICAL';
    if (high.includes(docType)) return 'HIGH';
    return 'MEDIUM';
  }
  
  private isDocumentCritical(docType: any): boolean {
    return ['TAX_RETURN', 'BANK_STATEMENT', 'DRIVERS_LICENSE'].includes(docType);
  }
}

export const outcomeScoringEngine = new OutcomeScoringEngine();
