import express, { Request, Response, NextFunction } from 'express';
import { config, validateConfig } from './config';
import { applicationController } from './controllers/ApplicationController';

// Validate configuration on startup
validateConfig();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Documentation
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'TriIQ Smart Form API',
    description: 'Agentic, outcome-based intake system for small-business lending',
    version: '1.0.0',
    endpoints: {
      'POST /api/applications': 'Create new application',
      'GET /api/applications': 'List applications',
      'GET /api/applications/:id': 'Get application details',
      'GET /api/applications/:id/next-questions': 'Get next questions',
      'POST /api/applications/:id/answers': 'Submit answer',
      'PATCH /api/applications/:id/status': 'Update status',
      'POST /api/applications/:id/workflows': 'Trigger workflow',
      'GET /api/applications/:id/audit': 'Get audit log',
    },
  });
});

// Application routes
app.post('/api/applications', (req, res) => applicationController.createApplication(req, res));
app.get('/api/applications', (req, res) => applicationController.listApplications(req, res));
app.get('/api/applications/:id', (req, res) => applicationController.getApplication(req, res));
app.get('/api/applications/:id/next-questions', (req, res) => applicationController.getNextQuestions(req, res));
app.post('/api/applications/:id/answers', (req, res) => applicationController.submitAnswer(req, res));
app.patch('/api/applications/:id/status', (req, res) => applicationController.updateStatus(req, res));
app.post('/api/applications/:id/workflows', (req, res) => applicationController.triggerWorkflow(req, res));
app.get('/api/applications/:id/audit', (req, res) => applicationController.getAuditLog(req, res));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`TriIQ Smart Form server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});

export default app;
