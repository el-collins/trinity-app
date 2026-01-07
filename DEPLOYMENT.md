# Deployment Guide

## Prerequisites

Before deploying TriIQ Smart Form, ensure you have:

1. **Google Cloud Project** with Firestore enabled
2. **Node.js 18+** installed
3. **gcloud CLI** installed and configured (for Cloud deployment)
4. **GoHighLevel Account** (optional, for engagement features)
5. **n8n Instance** (optional, for workflow orchestration)

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/hdsDevOps/trinityiq-smartform.git
cd trinityiq-smartform
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
PORT=3000
NODE_ENV=development
```

### 3. Run Locally

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## Firestore Setup

### Option 1: Use Firestore Emulator (Development)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init firestore

# Start emulator
firebase emulators:start --only firestore
```

In your `.env`:

```env
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Option 2: Use Production Firestore

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Firestore API
3. Create a Firestore database in Native mode
4. Set up authentication:

```bash
# Authenticate gcloud
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

In your `.env`:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
# Remove FIRESTORE_EMULATOR_HOST
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Applications collection
    match /applications/{applicationId} {
      allow read: if true; // Add authentication
      allow create: if true; // Add authentication
      allow update: if true; // Add authentication
    }
    
    // Audit log collection
    match /audit_log/{logId} {
      allow read: if true; // Add authentication
      allow write: if false; // Only server can write
    }
  }
}
```

### Firestore Indexes

Create these composite indexes for optimal query performance:

```bash
# applications collection
- Collection ID: applications
- Fields: status (Ascending), createdAt (Descending)

- Collection ID: applications  
- Fields: applicantEmail (Ascending), createdAt (Descending)

# audit_log collection
- Collection ID: audit_log
- Fields: applicationId (Ascending), timestamp (Descending)
```

## GoHighLevel Setup

### 1. Get API Credentials

1. Log into your GoHighLevel account
2. Go to Settings → API
3. Generate an API key
4. Note your Location ID

### 2. Configure Environment

Add to `.env`:

```env
GHL_API_KEY=your-api-key
GHL_LOCATION_ID=your-location-id
GHL_API_URL=https://rest.gohighlevel.com/v1
```

### 3. Set Up Pipelines (Optional)

Create pipelines in GoHighLevel for:
- Loan Application Pipeline
- Stages: New, In Progress, Under Review, Approved, Rejected

### 4. Configure Custom Fields

Create custom fields in GoHighLevel:
- Application ID
- Business Name
- Loan Amount
- Risk Score
- Underwriting Readiness

## n8n Setup

### 1. Deploy n8n

**Option A: n8n Cloud**
- Sign up at [n8n.io](https://n8n.io)
- Create a new workflow instance

**Option B: Self-Hosted**

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Create Workflows

Create these n8n workflows:

#### Credit Check Workflow

```
Webhook (Trigger)
  ↓
HTTP Request (Credit Bureau API)
  ↓
Function (Process Response)
  ↓
HTTP Request (Update Application in TriIQ)
  ↓
Email (Notify Applicant)
```

#### Document Collection Workflow

```
Webhook (Trigger)
  ↓
Function (Generate Document List)
  ↓
HTTP Request (GoHighLevel - Send Email)
  ↓
Wait (For Documents)
  ↓
HTTP Request (Update Application Status)
```

#### Underwriting Review Workflow

```
Webhook (Trigger)
  ↓
Function (Prepare Review Package)
  ↓
HTTP Request (Create Task in System)
  ↓
Email (Notify Underwriter)
  ↓
Wait (For Decision)
  ↓
HTTP Request (Update Application Status)
```

### 3. Configure Webhooks

For each workflow:
1. Copy the webhook URL
2. Add to your `.env`:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_API_KEY=your-n8n-api-key
```

## Production Deployment

### Option 1: Google Cloud Run (Recommended)

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. Build and Deploy

```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT/trinityiq-smartform

# Deploy to Cloud Run
gcloud run deploy trinityiq-smartform \
  --image gcr.io/YOUR_PROJECT/trinityiq-smartform \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT,NODE_ENV=production \
  --set-secrets GHL_API_KEY=ghl-api-key:latest,N8N_API_KEY=n8n-api-key:latest
```

#### 3. Set Up Secrets

```bash
# Create secrets in Secret Manager
echo -n "your-ghl-api-key" | gcloud secrets create ghl-api-key --data-file=-
echo -n "your-n8n-api-key" | gcloud secrets create n8n-api-key --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding ghl-api-key \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor
```

### Option 2: Google Cloud Functions

Deploy specific endpoints as functions:

```bash
gcloud functions deploy createApplication \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point createApplication \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT
```

### Option 3: Traditional VPS/Server

#### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start dist/index.js --name trinityiq-smartform

# Configure startup script
pm2 startup
pm2 save
```

#### Using systemd

Create `/etc/systemd/system/trinityiq-smartform.service`:

```ini
[Unit]
Description=TriIQ Smart Form
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/trinityiq-smartform
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
EnvironmentFile=/opt/trinityiq-smartform/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable trinityiq-smartform
sudo systemctl start trinityiq-smartform
```

## Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name api.trinityiq.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL/TLS Setup

### Using Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.trinityiq.com
```

### Using Cloud Load Balancer

Google Cloud Run provides automatic HTTPS.

## Monitoring and Logging

### Google Cloud Monitoring

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# View logs
gcloud logging read "resource.type=cloud_run_revision"
```

### Application Logging

The application logs to stdout/stderr. In production:

```typescript
// Add structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});
```

### Health Checks

Configure health checks:

```bash
# Cloud Run health check
gcloud run services update trinityiq-smartform \
  --health-check-path=/health \
  --health-check-interval=60s
```

## Performance Optimization

### 1. Enable Caching

Add Redis for question caching:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache questions
await redis.setex('questions:all', 3600, JSON.stringify(questions));
```

### 2. Database Optimization

- Create Firestore indexes (see above)
- Use batch operations for bulk updates
- Implement pagination for large result sets

### 3. CDN Setup

Use Cloud CDN for static assets:

```bash
gcloud compute backend-services create trinityiq-backend \
  --global \
  --enable-cdn
```

## Backup and Disaster Recovery

### Firestore Backups

```bash
# Enable automatic backups
gcloud firestore export gs://YOUR_BUCKET/backups

# Schedule daily backups
gcloud scheduler jobs create app-engine daily-backup \
  --schedule="0 2 * * *" \
  --time-zone="America/New_York" \
  --uri="https://YOUR_FUNCTION_URL/backup"
```

### Database Migration

For major schema changes:

```bash
# Export data
gcloud firestore export gs://YOUR_BUCKET/export

# Transform data (custom script)
node scripts/migrate.js

# Import data
gcloud firestore import gs://YOUR_BUCKET/transformed
```

## Security Hardening

### 1. API Authentication

Add JWT authentication:

```typescript
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 2. Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Input Validation

```typescript
import { z } from 'zod';

const createApplicationSchema = z.object({
  businessName: z.string().min(1).max(255),
  applicantEmail: z.string().email(),
});

// In controller
const validated = createApplicationSchema.parse(req.body);
```

## Troubleshooting

### Common Issues

**Issue**: Firestore permission denied
```bash
# Solution: Check service account permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member=serviceAccount:YOUR_SA \
  --role=roles/datastore.user
```

**Issue**: GoHighLevel API errors
```bash
# Solution: Verify API key and test endpoint
curl -H "Authorization: Bearer YOUR_KEY" \
  https://rest.gohighlevel.com/v1/contacts/
```

**Issue**: n8n webhooks not triggering
```bash
# Solution: Check n8n logs and webhook URL
# Ensure n8n instance is publicly accessible
```

## Maintenance

### Regular Tasks

- Monitor error logs daily
- Review audit logs weekly
- Update dependencies monthly
- Backup database weekly
- Review and optimize indexes quarterly

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Deploy
gcloud run deploy trinityiq-smartform --image gcr.io/YOUR_PROJECT/trinityiq-smartform
```

## Support and Resources

- **Documentation**: See README.md and ARCHITECTURE.md
- **Issues**: Open issues on GitHub
- **API Reference**: Access `/` endpoint for API documentation
