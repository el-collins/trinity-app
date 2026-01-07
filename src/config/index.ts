import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Firestore
  firestore: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
  },
  
  // GoHighLevel
  goHighLevel: {
    apiKey: process.env.GHL_API_KEY || '',
    locationId: process.env.GHL_LOCATION_ID || '',
    apiUrl: process.env.GHL_API_URL || 'https://rest.gohighlevel.com/v1',
  },
  
  // n8n
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    apiKey: process.env.N8N_API_KEY || '',
  },
};

export function validateConfig(): void {
  const required = [
    'GOOGLE_CLOUD_PROJECT',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work correctly. Check .env.example for reference.');
  }
}
