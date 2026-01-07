# TriIQ Smart Form

An agentic, outcome-based intake system for small-business lending that designs dynamic, stateful application journeys optimized for underwriting readiness and risk scoring.

## Overview

TriIQ Smart Form revolutionizes the lending application process by:

- **Dynamic Question Selection**: Uses information value scoring to select the most relevant questions based on current application state
- **Underwriting-Focused**: Optimizes for underwriting readiness and risk scoring rather than static form completion
- **Multi-Owner Workflows**: Supports complex business ownership structures with coordinated data collection
- **Full Auditability**: Comprehensive audit trails for compliance and transparency
- **Intelligent Orchestration**: Integrates with n8n for workflow automation and GoHighLevel for engagement

## Architecture

### System Components

1. **Firestore**: System of record for normalized data and state
2. **GoHighLevel**: Engagement and communication platform
3. **n8n**: Workflow orchestration engine
4. **Question Selection Engine**: AI-powered next-best question algorithm

### Key Features

- **Information Value Scoring**: Each question has an information value that influences selection
- **Prerequisite Management**: Questions can depend on previous answers
- **Risk Scoring**: Real-time risk assessment based on collected information
- **Underwriting Readiness**: Continuous calculation of readiness for underwriting review
- **Stage Progression**: Automatic advancement through application stages
- **Compliance Tracking**: Built-in compliance notes and audit logging

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud project with Firestore enabled
- GoHighLevel account (optional, for engagement features)
- n8n instance (optional, for workflow orchestration)

### Installation

```bash
# Clone the repository
git clone https://github.com/hdsDevOps/trinityiq-smartform.git
cd trinityiq-smartform

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
# At minimum, set GOOGLE_CLOUD_PROJECT
```

### Configuration

Edit `.env` file with your settings:

```env
# Required
GOOGLE_CLOUD_PROJECT=your-project-id

# Optional (for Firestore emulator)
FIRESTORE_EMULATOR_HOST=localhost:8080

# Optional (for GoHighLevel integration)
GHL_API_KEY=your-api-key
GHL_LOCATION_ID=your-location-id

# Optional (for n8n integration)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_API_KEY=your-api-key
```

### Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## API Reference

### Create Application

```http
POST /api/applications
Content-Type: application/json

{
  "businessName": "Acme Corp",
  "applicantEmail": "owner@acmecorp.com",
  "owners": []
}
```

**Response:**
```json
{
  "application": {
    "id": "uuid",
    "businessName": "Acme Corp",
    "status": "DRAFT",
    "currentStage": "BASIC_INFO",
    "underwritingReadiness": 0,
    ...
  },
  "nextQuestions": [...]
}
```

### Get Next Questions

```http
GET /api/applications/:id/next-questions?limit=3
```

Returns the next best questions to ask based on:
- Current application state
- Information gaps
- Underwriting requirements
- Risk assessment needs

**Response:**
```json
{
  "questions": [
    {
      "id": "q_business_name",
      "text": "What is your business name?",
      "type": "TEXT",
      "category": "BASIC_INFO",
      "informationValue": 10,
      ...
    }
  ],
  "underwritingReadiness": 0.35,
  "riskScore": 65
}
```

### Submit Answer

```http
POST /api/applications/:id/answers
Content-Type: application/json

{
  "questionId": "q_business_name",
  "value": "Acme Corp",
  "answeredBy": "owner@acmecorp.com"
}
```

**Response:**
```json
{
  "success": true,
  "application": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "underwritingReadiness": 0.42,
    "riskScore": 68
  },
  "nextQuestions": [...]
}
```

### Update Application Status

```http
PATCH /api/applications/:id/status
Content-Type: application/json

{
  "status": "PENDING_REVIEW",
  "userId": "underwriter@bank.com"
}
```

### Trigger Workflow

```http
POST /api/applications/:id/workflows
Content-Type: application/json

{
  "workflowType": "credit_check",
  "userId": "system"
}
```

Supported workflow types:
- `credit_check`: Initiate credit verification
- `underwriting_review`: Send to underwriting
- `document_collection`: Request documents
- `compliance_check`: Run compliance validation

### Get Audit Log

```http
GET /api/applications/:id/audit
```

Returns complete audit trail including:
- Question answers
- Status changes
- Workflow triggers
- Notifications sent

## Data Models

### Application State

```typescript
interface ApplicationState {
  id: string;
  businessName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  currentStage: ApplicationStage;
  owners: ApplicationOwner[];
  responses: Record<string, QuestionResponse>;
  riskScore?: number;
  underwritingReadiness: number;
  nextQuestions: string[];
  completedQuestions: string[];
  auditLog: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Question

```typescript
interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: QuestionCategory;
  informationValue: number;
  dependsOn?: string[];
  prerequisites?: QuestionPrerequisite[];
  validation?: ValidationRule;
  options?: QuestionOption[];
  applicableStages: ApplicationStage[];
  riskImpact: RiskImpact;
  underwritingWeight: number;
}
```

## Question Selection Algorithm

The question selection engine uses a sophisticated scoring algorithm:

1. **Base Score**: Start with question's `informationValue`
2. **Information Gap Boost**: Multiply by 1.5 if question fills a gap
3. **Priority Area Boost**: Multiply by 1.3 if in priority category
4. **Underwriting Weight**: Boost based on underwriting importance
5. **Risk Impact**: Boost based on risk scoring value
6. **Dependency Penalty**: Reduce score for unanswered dependencies

Questions are then ranked and the top N are selected.

## Underwriting Readiness

Calculated as a weighted score (0-1):
- 70% critical questions (underwritingWeight >= 8)
- 30% total question coverage

Applications typically advance stages when readiness > 0.8.

## Risk Scoring

Risk scores (0-100) are calculated by:
1. Evaluating each answer's risk impact
2. Weighting by risk dimension importance
3. Normalizing to 0-100 scale (50 = neutral)

Lower scores indicate lower risk.

## Multi-Owner Workflows

The system supports multiple business owners:

```typescript
interface ApplicationOwner {
  id: string;
  name: string;
  email: string;
  role: OwnerRole; // OWNER, CO_OWNER, GUARANTOR
  sharePercentage?: number;
  isPrimary: boolean;
  status: OwnerStatus;
}
```

Questions can be targeted to specific owner roles using `applicableRoles`.

## Compliance & Auditability

Every action is logged with:
- Timestamp
- User ID
- Action type
- Detailed context
- IP address and user agent (when available)

Audit logs are immutable and stored separately from application data.

## Integration Guides

### GoHighLevel Integration

GoHighLevel is used exclusively for engagement:
- Contact creation/updates
- SMS and email notifications
- Tagging and segmentation
- Opportunity tracking

### n8n Workflows

n8n handles complex orchestration:
- Credit check initiation
- Document collection flows
- Underwriting review routing
- Compliance verification
- Multi-owner coordination

Create webhooks in n8n and configure in your `.env`:

```env
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
```

## Development

### Project Structure

```
src/
├── config/           # Configuration management
├── models/           # TypeScript interfaces
├── services/         # Business logic
│   ├── FirestoreService.ts
│   ├── QuestionSelectionEngine.ts
│   ├── QuestionRepository.ts
│   ├── GoHighLevelService.ts
│   └── N8NService.ts
├── controllers/      # API controllers
└── index.ts          # Express app
```

### Adding Questions

Edit `src/services/QuestionRepository.ts` to add questions:

```typescript
{
  id: 'q_custom',
  text: 'Your question?',
  type: QuestionType.TEXT,
  category: QuestionCategory.BASIC_INFO,
  informationValue: 8,
  applicableStages: [ApplicationStage.BASIC_INFO],
  riskImpact: {
    dimension: RiskDimension.CREDIT_RISK,
    weight: 5,
    direction: 'NEUTRAL'
  },
  underwritingWeight: 7,
}
```

### Testing with Firestore Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulator
firebase emulators:start --only firestore

# In another terminal, set env and run app
export FIRESTORE_EMULATOR_HOST=localhost:8080
npm run dev
```

## Production Deployment

### Google Cloud Run (Recommended)

```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT/trinityiq-smartform

# Deploy
gcloud run deploy trinityiq-smartform \
  --image gcr.io/YOUR_PROJECT/trinityiq-smartform \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables

Set in Cloud Run:
- `GOOGLE_CLOUD_PROJECT`
- `GHL_API_KEY`
- `GHL_LOCATION_ID`
- `N8N_WEBHOOK_URL`
- `N8N_API_KEY`

## License

MIT

## Support

For questions or issues, please open an issue on GitHub. 
