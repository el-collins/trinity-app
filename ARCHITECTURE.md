# Trinity Finance SmartForm - Architecture

```
┌─────────────────────────────────────────────────┐
│           User Interface (Next.js)              │
├─────────────────────────────────────────────────┤
│  • Dynamic Form Components                      │
│  • URL-Based State Sharing (JWT tokens)         │
│  • Real-Time Validation (on blur)               │
│  • Review/Summary Page with Error Highlighting  │
│  • Auto-formatting (SSN, EIN, Phone, ZIP)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Agentic Layer (AI-Powered)              │
├─────────────────────────────────────────────────┤
│  • Form Agent (planNextSection)                 │
│  • Field Suggestions (suggestFieldValue)        │
│  • Section Optimization (optimizeSectionOrder)  │
│  • Skip Logic (shouldSkipSection)               │
│  • Multi-Provider Support (Claude/GPT/Gemini)   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│        Entity Mapping (Neo4j Graph DB)          │
├─────────────────────────────────────────────────┤
│  • 7 Loan Types                                 │
│  • 118+ Fields with Validation Rules            │
│  • Relationships & Conditional Logic (showIf)   │
│  • Dynamic Field Dependencies                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│       Data Persistence (Firebase/Firestore)     │
├─────────────────────────────────────────────────┤
│  • Application Storage (submitted forms)        │
│  • Backup & Audit Trail                         │
│  • Success Page Data Retrieval                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│        CRM Integration (GoHighLevel)            │
├─────────────────────────────────────────────────┤
│  • Early Contact Sync (on contact section)      │
│  • Lead Capture: Name, Email, Phone             │
│  • Tags: Application In Progress, Loan Type     │
│  • Custom Fields: Application ID, Status        │
└─────────────────────────────────────────────────┘
```

## Key Features

### 1. URL-Based Sharing
- Form state encoded in URL using lz-string compression
- No database lookup required for resume
- Works cross-browser and cross-device
- Format: `/apply/mca?resume=<compressed-token>`

### 2. Real-Time Validation
- Validation on blur (when leaving field)
- Format-specific validation (SSN, EIN, ZIP, URL)
- Auto-formatting as user types
- Error display on review page with field highlighting

### 3. AI-Powered Navigation
- Dynamic section ordering based on responses
- Skip irrelevant sections automatically
- Field value suggestions
- Multi-provider AI support (Anthropic, Azure OpenAI, Gemini)

### 4. Early Lead Capture
- Contact data sent to GHL when contact section completes
- Enables immediate follow-up
- Application continues in background

## Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **State:** Zustand with persist middleware
- **Validation:** Zod schemas
- **Database:** Neo4j (config), Firestore (submissions)
- **AI:** Anthropic Claude, Azure OpenAI, Google Gemini
- **CRM:** GoHighLevel webhooks