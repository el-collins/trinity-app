# API Usage Examples

This document provides practical examples of using the TriIQ Smart Form API.

## Table of Contents

1. [Create Application](#create-application)
2. [Get Next Questions](#get-next-questions)
3. [Submit Answers](#submit-answers)
4. [Monitor Progress](#monitor-progress)
5. [Trigger Workflows](#trigger-workflows)
6. [Multi-Owner Scenario](#multi-owner-scenario)

## Prerequisites

Set your base URL:

```bash
export API_BASE_URL="http://localhost:3000"
# or
export API_BASE_URL="https://your-deployment.run.app"
```

## Create Application

Start a new loan application:

```bash
curl -X POST $API_BASE_URL/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Acme Manufacturing LLC",
    "applicantEmail": "john.doe@acmemfg.com",
    "owners": [
      {
        "name": "John Doe",
        "email": "john.doe@acmemfg.com",
        "role": "OWNER",
        "isPrimary": true,
        "sharePercentage": 60,
        "status": "ACTIVE"
      },
      {
        "name": "Jane Smith",
        "email": "jane.smith@acmemfg.com",
        "role": "CO_OWNER",
        "isPrimary": false,
        "sharePercentage": 40,
        "status": "PENDING"
      }
    ]
  }'
```

**Response:**

```json
{
  "application": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "businessName": "Acme Manufacturing LLC",
    "applicantEmail": "john.doe@acmemfg.com",
    "status": "DRAFT",
    "currentStage": "BASIC_INFO",
    "underwritingReadiness": 0,
    "nextQuestions": ["q_business_name", "q_business_structure", "q_years_in_business"]
  },
  "nextQuestions": [
    {
      "id": "q_business_name",
      "text": "What is your business name?",
      "type": "TEXT",
      "category": "BASIC_INFO",
      "informationValue": 10,
      "underwritingWeight": 9
    },
    ...
  ]
}
```

Save the application ID for subsequent requests:

```bash
export APP_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Get Next Questions

Retrieve the next set of questions to ask:

```bash
curl -X GET "$API_BASE_URL/api/applications/$APP_ID/next-questions?limit=3"
```

**Response:**

```json
{
  "questions": [
    {
      "id": "q_business_structure",
      "text": "What is your business structure?",
      "type": "SELECT",
      "options": [
        {"value": "sole_proprietorship", "label": "Sole Proprietorship"},
        {"value": "llc", "label": "LLC"},
        {"value": "corporation", "label": "Corporation"},
        {"value": "partnership", "label": "Partnership"}
      ],
      "validation": {"required": true}
    },
    {
      "id": "q_years_in_business",
      "text": "How many years has your business been operating?",
      "type": "NUMBER",
      "validation": {"required": true, "min": 0, "max": 100}
    },
    {
      "id": "q_annual_revenue",
      "text": "What is your estimated annual revenue?",
      "type": "CURRENCY",
      "validation": {"required": true, "min": 0}
    }
  ],
  "underwritingReadiness": 0.15,
  "riskScore": 50
}
```

## Submit Answers

Submit answers to questions one at a time:

### Example 1: Text Answer

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_business_name",
    "value": "Acme Manufacturing LLC",
    "answeredBy": "john.doe@acmemfg.com"
  }'
```

### Example 2: Select Answer

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_business_structure",
    "value": "llc",
    "answeredBy": "john.doe@acmemfg.com"
  }'
```

### Example 3: Number Answer

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_years_in_business",
    "value": 5,
    "answeredBy": "john.doe@acmemfg.com"
  }'
```

### Example 4: Currency Answer

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_annual_revenue",
    "value": 1500000,
    "answeredBy": "john.doe@acmemfg.com"
  }'
```

### Example 5: Boolean Answer

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_collateral_available",
    "value": true,
    "answeredBy": "john.doe@acmemfg.com"
  }'
```

### Example 6: Multi-Select Answer

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_use_of_funds",
    "value": ["working_capital", "equipment", "expansion"],
    "answeredBy": "john.doe@acmemfg.com"
  }'
```

**Typical Response:**

```json
{
  "success": true,
  "application": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "IN_PROGRESS",
    "currentStage": "BUSINESS_DETAILS",
    "underwritingReadiness": 0.42,
    "riskScore": 68
  },
  "nextQuestions": [
    {
      "id": "q_loan_amount",
      "text": "How much funding are you requesting?",
      ...
    },
    ...
  ]
}
```

## Monitor Progress

Check application status and progress:

```bash
curl -X GET "$API_BASE_URL/api/applications/$APP_ID"
```

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "businessName": "Acme Manufacturing LLC",
  "status": "IN_PROGRESS",
  "currentStage": "FINANCIAL_INFO",
  "underwritingReadiness": 0.68,
  "riskScore": 72,
  "completedQuestions": [
    "q_business_name",
    "q_business_structure",
    "q_years_in_business",
    "q_annual_revenue",
    "q_loan_amount"
  ],
  "responses": {
    "q_business_name": {
      "questionId": "q_business_name",
      "value": "Acme Manufacturing LLC",
      "answeredBy": "john.doe@acmemfg.com",
      "answeredAt": "2026-01-06T10:30:00.000Z"
    },
    ...
  }
}
```

## Trigger Workflows

### Credit Check

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowType": "credit_check",
    "userId": "system"
  }'
```

### Document Collection

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowType": "document_collection",
    "documents": [
      "Business Tax Returns (2 years)",
      "Bank Statements (3 months)",
      "Profit & Loss Statement",
      "Balance Sheet"
    ],
    "userId": "underwriter@bank.com"
  }'
```

### Underwriting Review

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowType": "underwriting_review",
    "userId": "system"
  }'
```

### Compliance Check

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowType": "compliance_check",
    "userId": "compliance@bank.com"
  }'
```

## Update Application Status

Change the application status:

```bash
curl -X PATCH "$API_BASE_URL/api/applications/$APP_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PENDING_REVIEW",
    "userId": "underwriter@bank.com"
  }'
```

**Valid Status Values:**
- `DRAFT`
- `IN_PROGRESS`
- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `NEEDS_INFO`

## Get Audit Log

Retrieve complete audit trail:

```bash
curl -X GET "$API_BASE_URL/api/applications/$APP_ID/audit"
```

**Response:**

```json
{
  "auditLog": [
    {
      "id": "log_001",
      "timestamp": "2026-01-06T10:30:00.000Z",
      "action": "APPLICATION_CREATED",
      "userId": "john.doe@acmemfg.com",
      "details": {
        "businessName": "Acme Manufacturing LLC"
      }
    },
    {
      "id": "log_002",
      "timestamp": "2026-01-06T10:35:00.000Z",
      "action": "QUESTION_ANSWERED",
      "userId": "john.doe@acmemfg.com",
      "details": {
        "questionId": "q_business_name",
        "value": "Acme Manufacturing LLC"
      }
    },
    ...
  ]
}
```

## Multi-Owner Scenario

Complete workflow for an application with multiple owners:

### Step 1: Primary Owner Creates Application

```bash
curl -X POST $API_BASE_URL/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Tech Startup Inc",
    "applicantEmail": "alice@techstartup.com",
    "owners": [
      {
        "id": "owner1",
        "name": "Alice Johnson",
        "email": "alice@techstartup.com",
        "role": "OWNER",
        "isPrimary": true,
        "sharePercentage": 51,
        "status": "ACTIVE"
      },
      {
        "id": "owner2",
        "name": "Bob Williams",
        "email": "bob@techstartup.com",
        "role": "CO_OWNER",
        "isPrimary": false,
        "sharePercentage": 49,
        "status": "PENDING"
      }
    ]
  }'
```

### Step 2: Primary Owner Answers Questions

```bash
# Answer business-level questions
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_business_structure",
    "value": "corporation",
    "answeredBy": "alice@techstartup.com"
  }'

# Answer personal questions for primary owner
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_owner_name",
    "value": "Alice Johnson",
    "answeredBy": "alice@techstartup.com"
  }'
```

### Step 3: Co-Owner Answers Their Questions

```bash
# Co-owner answers personal questions
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_owner_name",
    "value": "Bob Williams",
    "answeredBy": "bob@techstartup.com"
  }'

curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_personal_credit_score",
    "value": "700-749",
    "answeredBy": "bob@techstartup.com"
  }'
```

### Step 4: System Determines Next Steps

The system automatically:
- Tracks which owner answered which question
- Determines which questions apply to which owners
- Calculates overall application readiness
- Advances stages when appropriate

## List Applications

Get list of applications with filtering:

### All Applications

```bash
curl -X GET "$API_BASE_URL/api/applications"
```

### Filter by Status

```bash
curl -X GET "$API_BASE_URL/api/applications?status=IN_PROGRESS"
```

### Filter by Email

```bash
curl -X GET "$API_BASE_URL/api/applications?email=john.doe@acmemfg.com"
```

### With Pagination

```bash
curl -X GET "$API_BASE_URL/api/applications?limit=10"
```

## Integration Examples

### Using with JavaScript/TypeScript

```typescript
const API_BASE_URL = 'http://localhost:3000';

async function createApplication(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

async function submitAnswer(appId: string, answer: any) {
  const response = await fetch(`${API_BASE_URL}/api/applications/${appId}/answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answer),
  });
  
  return response.json();
}

// Usage
const app = await createApplication({
  businessName: 'My Business',
  applicantEmail: 'owner@mybusiness.com',
});

const result = await submitAnswer(app.application.id, {
  questionId: 'q_business_name',
  value: 'My Business',
  answeredBy: 'owner@mybusiness.com',
});
```

### Using with Python

```python
import requests

API_BASE_URL = 'http://localhost:3000'

def create_application(data):
    response = requests.post(
        f'{API_BASE_URL}/api/applications',
        json=data
    )
    return response.json()

def submit_answer(app_id, answer):
    response = requests.post(
        f'{API_BASE_URL}/api/applications/{app_id}/answers',
        json=answer
    )
    return response.json()

# Usage
app = create_application({
    'businessName': 'My Business',
    'applicantEmail': 'owner@mybusiness.com'
})

result = submit_answer(app['application']['id'], {
    'questionId': 'q_business_name',
    'value': 'My Business',
    'answeredBy': 'owner@mybusiness.com'
})
```

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

**Error Response Format:**

```json
{
  "error": "Error message describing what went wrong"
}
```

**Example Error:**

```bash
curl -X POST "$API_BASE_URL/api/applications/$APP_ID/answers" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "invalid_question"
  }'
```

**Response (400):**

```json
{
  "error": "questionId, value, and answeredBy are required"
}
```
