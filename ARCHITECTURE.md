# Architecture Overview

## System Design Principles

TriIQ Smart Form is built on several core principles:

1. **Outcome-Based, Not Form-Based**: The system optimizes for underwriting readiness and risk assessment, not just data collection
2. **Agentic Intelligence**: Questions are dynamically selected based on information value and current state
3. **Separation of Concerns**: Firestore for data, GoHighLevel for engagement, n8n for orchestration
4. **Compliance First**: All actions are audited and traceable

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
│                    (Web/Mobile Frontend)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│                    Express API Server                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Application Controller Layer                  │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │              Service Layer                            │  │
│  │  • QuestionSelectionEngine (Agentic Logic)           │  │
│  │  • QuestionRepository (Question Data)                │  │
│  │  • FirestoreService (Data Persistence)               │  │
│  │  • GoHighLevelService (Engagement)                   │  │
│  │  • N8NService (Workflow Orchestration)               │  │
│  └──────┬────────────────┬──────────────────┬────────────┘  │
└─────────┼────────────────┼──────────────────┼───────────────┘
          │                │                  │
┌─────────▼─────┐  ┌───────▼──────┐  ┌────────▼──────┐
│   Firestore   │  │ GoHighLevel  │  │      n8n      │
│  (Data & State)│  │ (Engagement) │  │  (Workflows)  │
└───────────────┘  └──────────────┘  └───────────────┘
```

## Data Flow

### 1. Application Creation

```
User → API → FirestoreService → Firestore
                ↓
        QuestionSelectionEngine
                ↓
        Return Initial Questions
                ↓
        GoHighLevelService → GHL (Welcome Email)
```

### 2. Question Answering Flow

```
User Answer → API → FirestoreService
                     ↓
              Update Application State
                     ↓
              QuestionSelectionEngine
                     ↓
              Calculate Scores:
              • Risk Score
              • Underwriting Readiness
                     ↓
              Select Next Questions
                     ↓
              Check Stage Advancement
                     ↓
              Update Firestore
                     ↓
              Log Audit Entry
                     ↓
              Return Next Questions
```

### 3. Workflow Triggering

```
Condition Met → N8NService → n8n Webhook
                              ↓
                         Execute Workflow:
                         • Credit Check
                         • Document Collection
                         • Underwriting Review
                         • Compliance Validation
                              ↓
                         Results → Firestore
                              ↓
                         GoHighLevelService → GHL Notification
```

## Question Selection Algorithm

The agentic core of the system is the question selection algorithm:

### Scoring Formula

```
score = informationValue
      × (1.5 if fills information gap)
      × (1.3 if in priority area)
      × (1 + underwritingWeight / 10)
      × (1 + |riskWeight| / 5)
      × (0.7 ^ unansweredDependencies)
```

### Selection Process

1. **Filter**: Remove answered questions
2. **Validate Prerequisites**: Check all prerequisites are met
3. **Stage Filtering**: Only questions applicable to current stage
4. **Score Calculation**: Apply scoring formula to each question
5. **Ranking**: Sort by score descending
6. **Selection**: Return top N questions

### Information Gap Identification

The system tracks coverage by category:

```typescript
categories = {
  BASIC_INFO: 2/5 questions answered,
  FINANCIAL_METRICS: 1/4 questions answered,
  CREDIT_HISTORY: 0/3 questions answered
}

// Gaps = categories with < 40% coverage
gaps = [FINANCIAL_METRICS, CREDIT_HISTORY]
```

### Priority Area Determination

Priority areas are determined by:

1. **Current Stage**: Each stage has default priority categories
2. **Underwriting Readiness**: Low readiness prioritizes high-weight categories
3. **Risk Factors**: Identified risks prioritize relevant categories

## State Management

### Application State Transitions

```
DRAFT → IN_PROGRESS → PENDING_REVIEW → APPROVED/REJECTED
  ↓          ↓              ↓
NEEDS_INFO ─────────────────┘
```

### Stage Progression

```
BASIC_INFO → BUSINESS_DETAILS → FINANCIAL_INFO → 
  CREDIT_CHECK → DOCUMENT_COLLECTION → FINAL_REVIEW
```

Stages advance automatically when:
- Underwriting readiness > 0.8 for current stage
- All critical questions for stage are answered
- Risk score is within acceptable range

## Risk Scoring Model

### Risk Dimensions

1. **Credit Risk**: Payment history, debt levels, credit scores
2. **Operational Risk**: Business structure, years in operation
3. **Market Risk**: Industry, market conditions, competition
4. **Liquidity Risk**: Cash flow, revenue, assets
5. **Compliance Risk**: Regulatory requirements, documentation

### Scoring Calculation

```typescript
totalRiskWeight = Σ |riskImpact.weight|
weightedRiskSum = Σ (riskImpact.weight × direction)

normalizedScore = 50 + (weightedRiskSum / totalRiskWeight) × 50
// Range: 0 (high risk) to 100 (low risk)
```

## Underwriting Readiness

### Calculation

```typescript
criticalQuestions = questions.filter(q => q.underwritingWeight >= 8)
criticalScore = answeredCritical / totalCritical

totalScore = answeredAll / totalQuestions

readiness = criticalScore × 0.7 + totalScore × 0.3
// Range: 0 (not ready) to 1 (ready)
```

### Thresholds

- **< 0.3**: Very early stage
- **0.3 - 0.5**: Progressing
- **0.5 - 0.8**: Good progress
- **> 0.8**: Ready for review

## Multi-Owner Coordination

### Owner Roles

1. **OWNER**: Primary business owner
2. **CO_OWNER**: Additional owners with ownership stake
3. **GUARANTOR**: Personal guarantors without ownership

### Question Targeting

Questions can specify `applicableRoles`:

```typescript
{
  id: 'q_owner_ssn',
  applicableRoles: [OwnerRole.OWNER, OwnerRole.CO_OWNER],
  // Only shown to owners and co-owners
}
```

### Workflow Coordination

n8n workflows handle:
- Sequential owner onboarding
- Parallel information collection
- Aggregation of owner data
- Notification when all owners complete

## Compliance & Auditability

### Audit Log Structure

```typescript
{
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
```

### Audit Actions

- `APPLICATION_CREATED`
- `QUESTION_ANSWERED`
- `QUESTION_UPDATED`
- `OWNER_ADDED`
- `STATUS_CHANGED`
- `STAGE_CHANGED`
- `DOCUMENT_UPLOADED`
- `RISK_SCORE_UPDATED`
- `WORKFLOW_TRIGGERED`
- `NOTIFICATION_SENT`

### Compliance Features

1. **Immutable Logs**: Audit entries are never modified
2. **Complete Trail**: Every action is logged
3. **User Attribution**: All actions tied to user ID
4. **Compliance Notes**: Questions include regulatory context
5. **Data Retention**: Configurable retention policies

## Integration Patterns

### Firestore Integration

```typescript
// All data stored in normalized collections
collections = {
  applications: Application[],
  audit_log: AuditEntry[]
}

// Optimized for:
// - Fast reads by application ID
// - Query by status/email
// - Ordered audit trails
```

### GoHighLevel Integration

```typescript
// One-way data flow: System → GHL
// Used for:
// - Contact management
// - Notifications (SMS/Email)
// - Pipeline/Opportunity tracking
// - Tagging and segmentation

// NOT used for:
// - Primary data storage
// - Application state
// - Business logic
```

### n8n Integration

```typescript
// Webhook-based orchestration
// Workflows handle:
// - External API calls (credit bureaus, etc.)
// - Long-running processes
// - Multi-step workflows
// - Error handling and retry logic

// System triggers workflows, n8n executes
```

## Security Considerations

1. **PII Handling**: SSN, credit info stored encrypted in Firestore
2. **API Authentication**: Add authentication middleware before production
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **Input Validation**: All inputs validated before processing
5. **Audit Logging**: Complete trail for security investigations

## Scalability

### Current Design

- Stateless API server (horizontal scaling)
- Firestore auto-scaling
- Async workflow execution via n8n
- Event-driven architecture

### Scaling Considerations

1. **Read Performance**: Add caching layer for questions
2. **Write Performance**: Firestore handles high write throughput
3. **Complex Queries**: Use Firestore composite indexes
4. **Background Jobs**: Move heavy computation to Cloud Functions

## Future Enhancements

1. **Machine Learning**: Train models on historical data to improve question selection
2. **Real-time Collaboration**: WebSocket support for multi-user editing
3. **Document Processing**: OCR and automated data extraction
4. **Advanced Analytics**: Dashboard for underwriting insights
5. **A/B Testing**: Test different question flows for optimization
