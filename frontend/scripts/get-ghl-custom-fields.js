/**
 * Script to fetch all custom fields from GoHighLevel
 * Run with: node scripts/get-ghl-custom-fields.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

async function getCustomFields() {
  const accessToken = envVars.GHL_ACCESS_TOKEN;
  const locationId = envVars.GHL_LOCATION_ID;

  if (!accessToken || !locationId) {
    console.error('ERROR: GHL_ACCESS_TOKEN and GHL_LOCATION_ID must be set in .env file');
    process.exit(1);
  }

  try {
    console.log('Fetching custom fields from GoHighLevel...\n');

    const response = await axios.get(`https://services.leadconnectorhq.com/locations/${locationId}/customFields`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
    });

    const customFields = response.data.customFields || [];

    console.log(`Found ${customFields.length} custom fields:\n`);
    console.log('='  .repeat(100));

    // Filter for document-related fields
    const documentFields = customFields.filter(field =>
      field.name.toLowerCase().includes('doc') ||
      field.name.toLowerCase().includes('document') ||
      field.name.toLowerCase().includes('upload') ||
      field.fieldKey?.includes('doc')
    );

    if (documentFields.length > 0) {
      console.log('\n📄 DOCUMENT-RELATED FIELDS:');
      console.log('='.repeat(100));
      documentFields.forEach(field => {
        console.log(`\nName: ${field.name}`);
        console.log(`ID: ${field.id}`);
        console.log(`Key: ${field.fieldKey || 'N/A'}`);
        console.log(`Type: ${field.dataType}`);
        console.log('-'.repeat(100));
      });
    }

    // Show all fields
    console.log('\n\n📋 ALL CUSTOM FIELDS:');
    console.log('='.repeat(100));
    customFields.forEach(field => {
      console.log(`\nName: ${field.name}`);
      console.log(`ID: ${field.id}`);
      console.log(`Key: ${field.fieldKey || 'N/A'}`);
      console.log(`Type: ${field.dataType}`);
      console.log('-'.repeat(100));
    });

    // Generate .env format
    console.log('\n\n🔧 SUGGESTED .ENV FORMAT FOR DOCUMENT FIELDS:');
    console.log('='.repeat(100));
    documentFields.forEach(field => {
      const envVarName = field.fieldKey
        ? `GHL_FIELD_${field.fieldKey.replace(/^contact\.doc_/, '').replace(/_url$/, '').toUpperCase()}`
        : `GHL_FIELD_${field.name.replace(/\s+/g, '_').toUpperCase()}`;
      console.log(`${envVarName}=${field.id}`);
    });

  } catch (error) {
    console.error('ERROR fetching custom fields:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    process.exit(1);
  }
}

getCustomFields();
