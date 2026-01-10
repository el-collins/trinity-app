/**
 * AI Planning Test Script
 * 
 * Tests the AI planning endpoint to verify it's working correctly
 * 
 * Usage:
 *   node test-ai-planning.js
 */

const testContext = {
  loanType: 'equipment_finance',
  currentSection: 'business_info',
  responses: {
    first_name: 'John',
    last_name: 'Doe',
    business_email: 'john@example.com',
    business_name: 'Test Company',
    industry: 'Restaurant',
    revenue: '500000',
    time_in_business: '3 years'
  },
  entityMap: {
    id: 'equipment_finance',
    name: 'Equipment Finance',
    tier: 2,
    sections: [
      { id: 'contact_info', label: 'Contact Information' },
      { id: 'business_info', label: 'Business Information' },
      { id: 'equipment_info', label: 'Equipment Information' },
      { id: 'owner_info', label: 'Owner Information' },
      { id: 'financial_basic', label: 'Financial Information' }
    ]
  },
  completedSections: ['contact_info']
};

async function testAIPlanning() {
  console.log('🧪 Testing AI Planning Endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testContext),
    });

    console.log('📡 Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const decision = await response.json();
    
    console.log('\n✅ AI Decision Received:\n');
    console.log('Action:', decision.action);
    console.log('Reasoning:', decision.reasoning);
    console.log('Data:', JSON.stringify(decision.data, null, 2));
    
    // Check if AI is actually working
    if (decision.reasoning === 'AI planning failed, proceeding with default flow') {
      console.log('\n⚠️  WARNING: AI planning failed!');
      console.log('This means:');
      console.log('  1. No AI API key is configured, OR');
      console.log('  2. The AI provider is returning an error');
      console.log('\nCheck your .env.local file and make sure you have:');
      console.log('  AGENTIC_PROVIDER=anthropic (or openai/gemini)');
      console.log('  ANTHROPIC_API_KEY=sk-ant-...');
    } else {
      console.log('\n🎉 AI is working correctly!');
      console.log('The AI analyzed the context and made an intelligent decision.');
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Next.js dev server is running (npm run dev)');
    console.error('  2. Server is accessible at http://localhost:3000');
  }
}

// Run the test
testAIPlanning();
