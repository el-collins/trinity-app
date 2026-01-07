# Quick Start Guide

Get TriIQ Smart Form running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Google Cloud account with Firestore enabled

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
```

## 3. Build the Project

```bash
npm run build
```

## 4. Start the Server

```bash
npm start
```

The API will be available at `http://localhost:3000`.

## 5. Test the API

### Create an application:

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Business",
    "applicantEmail": "test@example.com"
  }'
```

### Get next questions:

```bash
# Use the application ID from the previous response
curl http://localhost:3000/api/applications/{APP_ID}/next-questions
```

### Submit an answer:

```bash
curl -X POST http://localhost:3000/api/applications/{APP_ID}/answers \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "q_business_name",
    "value": "Test Business",
    "answeredBy": "test@example.com"
  }'
```

## 6. View API Documentation

Open `http://localhost:3000/` in your browser to see available endpoints.

## What You've Built

✅ Agentic question selection system
✅ Firestore data persistence
✅ RESTful API with Express
✅ Dynamic underwriting readiness calculation
✅ Real-time risk scoring
✅ Complete audit trail
✅ Multi-owner support
✅ Workflow orchestration ready

## Next Steps

- **Add Authentication**: See DEPLOYMENT.md
- **Configure GoHighLevel**: Add GHL_API_KEY to .env
- **Set up n8n**: Add N8N_WEBHOOK_URL to .env
- **Deploy to Production**: See DEPLOYMENT.md
- **Read Documentation**:
  - `README.md` - Full documentation
  - `ARCHITECTURE.md` - System design
  - `API_EXAMPLES.md` - API usage examples
  - `SUMMARY.md` - What makes this system special

## Troubleshooting

### "Firestore permission denied"

Make sure you've authenticated with Google Cloud:

```bash
gcloud auth application-default login
```

### "Module not found"

Reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use

Change the port in `.env`:

```env
PORT=8080
```

## Using with Firestore Emulator

For local development without Google Cloud:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulator
firebase emulators:start --only firestore
```

In another terminal:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
npm start
```

## Learn More

- **Question Selection Algorithm**: See `src/services/QuestionSelectionEngine.ts`
- **Question Library**: See `src/services/QuestionRepository.ts`
- **API Routes**: See `src/index.ts`
- **Data Models**: See `src/models/`

## Support

Questions? Check the documentation in:
- README.md
- ARCHITECTURE.md
- API_EXAMPLES.md
- DEPLOYMENT.md
