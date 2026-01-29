/**
 * Application configuration
 */

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
  },

  firestore: {
    projectId: process.env.FIRESTORE_PROJECT_ID || '',
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },

  goHighLevel: {
    apiKey: process.env.GHL_API_KEY || '',
    locationId: process.env.GHL_LOCATION_ID || '',
    customFields: {
      applicationId: process.env.GHL_FIELD_APPLICATION_ID || '',
      applicationStatus: process.env.GHL_FIELD_APPLICATION_STATUS || '',
      loanType: process.env.GHL_FIELD_LOAN_TYPE || '',
      applicationUrl: process.env.GHL_FIELD_APPLICATION_URL || '',
      submissionDate: process.env.GHL_FIELD_SUBMISSION_DATE || new Date().toISOString().split('T')[0],
      // Referral tracking fields
      referralCode: process.env.GHL_FIELD_REFERRAL_CODE || '',
      agentId: process.env.GHL_FIELD_AGENT_ID || '',
      utmSource: process.env.GHL_FIELD_UTM_SOURCE || '',
      utmMedium: process.env.GHL_FIELD_UTM_MEDIUM || '',
      utmCampaign: process.env.GHL_FIELD_UTM_CAMPAIGN || '',
    },
  },

  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },

  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    apiKey: process.env.N8N_API_KEY,
  },

  // Team notification settings
  notifications: {
    // Comma-separated list of team member emails for notifications
    teamEmails: (process.env.NOTIFICATION_TEAM_EMAILS || 'ccollins@hordanso.com').split(',').map(e => e.trim()),
    // Enable/disable specific notification types
    onApplicationSubmitted: process.env.NOTIFY_ON_APPLICATION_SUBMITTED !== 'false',
    onDocumentsUploaded: process.env.NOTIFY_ON_DOCUMENTS_UPLOADED !== 'false',
    // Admin email for system notifications
    adminEmail: process.env.ADMIN_EMAIL || 'ccollins@hordanso.com',
  },
};

/**
 * Validate required environment variables
 */
export function validateConfig() {
  const required = ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
  }
}
