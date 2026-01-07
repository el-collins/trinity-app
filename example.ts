/**
 * Example usage of the TriIQ Smart Form system
 * 
 * This file demonstrates how to use the core services programmatically
 */

import { firestoreService } from './src/services/FirestoreService';
import { questionSelectionEngine } from './src/services/QuestionSelectionEngine';
import { questionRepository } from './src/services/QuestionRepository';
import { goHighLevelService } from './src/services/GoHighLevelService';
import { n8nService } from './src/services/N8NService';
import { ApplicationStatus, ApplicationStage } from './src/models/Application';

async function exampleUsage() {
  console.log('=== TriIQ Smart Form Example Usage ===\n');
  
  // Step 1: Create a new application
  console.log('Step 1: Creating new application...');
  const application = await firestoreService.createApplication({
    businessName: 'Demo Tech Startup',
    applicantEmail: 'demo@example.com',
    owners: [
      {
        id: 'owner1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'OWNER' as any,
        isPrimary: true,
        sharePercentage: 100,
        status: 'ACTIVE' as any,
      }
    ],
    status: ApplicationStatus.DRAFT,
    currentStage: ApplicationStage.BASIC_INFO,
  });
  
  console.log(`✓ Application created with ID: ${application.id}\n`);
  
  // Step 2: Get next questions
  console.log('Step 2: Getting next questions...');
  const allQuestions = questionRepository.getAll();
  const nextQuestions = questionSelectionEngine.selectNextQuestions(
    application,
    allQuestions,
    3
  );
  
  console.log(`✓ Found ${nextQuestions.length} next questions:`);
  nextQuestions.forEach(q => {
    console.log(`  - ${q.id}: ${q.text}`);
  });
  console.log();
  
  // Step 3: Submit an answer
  console.log('Step 3: Submitting answer...');
  application.responses[nextQuestions[0].id] = {
    questionId: nextQuestions[0].id,
    value: 'Demo Tech Startup',
    answeredBy: 'demo@example.com',
    answeredAt: new Date(),
  };
  application.completedQuestions.push(nextQuestions[0].id);
  
  await firestoreService.updateApplication(application.id, {
    responses: application.responses,
    completedQuestions: application.completedQuestions,
  });
  
  console.log(`✓ Answer submitted for: ${nextQuestions[0].text}\n`);
  
  // Step 4: Calculate scores
  console.log('Step 4: Calculating scores...');
  const underwritingReadiness = questionSelectionEngine.calculateUnderwritingReadiness(
    application,
    allQuestions
  );
  const riskScore = questionSelectionEngine.calculateRiskScore(
    application,
    allQuestions
  );
  
  console.log(`✓ Underwriting Readiness: ${(underwritingReadiness * 100).toFixed(1)}%`);
  console.log(`✓ Risk Score: ${riskScore.toFixed(1)}/100\n`);
  
  // Step 5: Get updated next questions
  console.log('Step 5: Getting updated next questions...');
  const updatedApp = await firestoreService.getApplication(application.id);
  if (updatedApp) {
    const newNextQuestions = questionSelectionEngine.selectNextQuestions(
      updatedApp,
      allQuestions,
      3
    );
    
    console.log(`✓ Next ${newNextQuestions.length} questions to ask:`);
    newNextQuestions.forEach(q => {
      console.log(`  - ${q.id}: ${q.text} (info value: ${q.informationValue})`);
    });
    console.log();
  }
  
  // Step 6: Get audit log
  console.log('Step 6: Retrieving audit log...');
  const auditLog = await firestoreService.getAuditLog(application.id);
  console.log(`✓ Found ${auditLog.length} audit entries\n`);
  
  console.log('=== Example Complete ===');
  console.log('\nThis demonstrates the core agentic functionality:');
  console.log('1. Dynamic question selection based on information value');
  console.log('2. Automatic score calculation (underwriting & risk)');
  console.log('3. State management in Firestore');
  console.log('4. Full audit trail for compliance');
  console.log('\nFor API usage, see API_EXAMPLES.md');
}

// Run the example if executed directly
if (require.main === module) {
  exampleUsage()
    .then(() => {
      console.log('\n✓ Example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Error running example:', error);
      process.exit(1);
    });
}

export { exampleUsage };
