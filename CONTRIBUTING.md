# Contributing to TriIQ Smart Form

Thank you for your interest in contributing to TriIQ Smart Form!

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/trinityiq-smartform.git
   cd trinityiq-smartform
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. Build the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Build and test:
   ```bash
   npm run build
   npm run lint
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Run `npm run lint` before committing
- Write descriptive commit messages

### Adding Questions

To add new questions to the repository:

1. Edit `src/services/QuestionRepository.ts`
2. Add your question to the `initializeQuestions()` method
3. Follow the existing question structure:

```typescript
{
  id: 'q_your_question',
  text: 'Your question text?',
  type: QuestionType.TEXT,
  category: QuestionCategory.BASIC_INFO,
  informationValue: 8,
  applicableStages: [ApplicationStage.BASIC_INFO],
  validation: { required: true },
  riskImpact: {
    dimension: RiskDimension.CREDIT_RISK,
    weight: 5,
    direction: 'NEUTRAL'
  },
  underwritingWeight: 7,
}
```

### Adding Services

To add new service integrations:

1. Create a new file in `src/services/`
2. Export a class with your service logic
3. Export a singleton instance
4. Import and use in controllers

Example:

```typescript
// src/services/NewService.ts
export class NewService {
  constructor() {
    // Initialize
  }
  
  async doSomething() {
    // Implementation
  }
}

export const newService = new NewService();
```

### Adding API Endpoints

To add new API endpoints:

1. Add controller methods in `src/controllers/`
2. Add routes in `src/index.ts`
3. Update API documentation

Example:

```typescript
// In controller
async newEndpoint(req: Request, res: Response): Promise<void> {
  try {
    // Implementation
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// In src/index.ts
app.get('/api/new-endpoint', (req, res) => 
  controller.newEndpoint(req, res)
);
```

## Testing

Currently, the project uses manual testing. To add automated tests:

1. Create test files with `.test.ts` extension
2. Use Jest for testing
3. Run tests with `npm test`

Example test:

```typescript
import { questionSelectionEngine } from '../services/QuestionSelectionEngine';

describe('QuestionSelectionEngine', () => {
  it('should select questions', () => {
    // Test implementation
  });
});
```

## Documentation

When adding features, update documentation:

- **README.md** - For user-facing features
- **ARCHITECTURE.md** - For architectural changes
- **API_EXAMPLES.md** - For new API endpoints
- **DEPLOYMENT.md** - For deployment changes

## Commit Message Guidelines

Use clear, descriptive commit messages:

- `feat: Add credit score validation`
- `fix: Resolve Firestore timestamp conversion`
- `docs: Update API examples`
- `refactor: Simplify question selection logic`
- `test: Add tests for risk calculation`

## Pull Request Process

1. Update documentation if needed
2. Ensure your code builds successfully
3. Ensure linting passes
4. Write a clear PR description explaining:
   - What problem you're solving
   - How you solved it
   - Any breaking changes
   - Testing done

## Code Review

All PRs require review before merging. Reviews focus on:

- Code quality and style
- Logic correctness
- Performance implications
- Security considerations
- Documentation completeness

## Project Structure

```
src/
├── config/           # Configuration management
├── models/           # TypeScript interfaces
│   ├── Application.ts
│   ├── Question.ts
│   └── Workflow.ts
├── services/         # Business logic
│   ├── FirestoreService.ts
│   ├── QuestionSelectionEngine.ts
│   ├── QuestionRepository.ts
│   ├── GoHighLevelService.ts
│   └── N8NService.ts
├── controllers/      # API controllers
│   └── ApplicationController.ts
├── utils/           # Utility functions
│   └── ValidationUtils.ts
└── index.ts         # Express app entry point
```

## Key Concepts

### Agentic Question Selection

The core innovation is selecting questions based on information value rather than a fixed sequence. When modifying the selection algorithm:

- Consider information theory principles
- Maintain the scoring formula integrity
- Test with various application states
- Document changes to the algorithm

### State Management

All state changes must:
- Update Firestore
- Log audit entries
- Recalculate scores
- Update next questions queue

### Compliance

When handling sensitive data:
- Follow PII handling best practices
- Log all access and modifications
- Add compliance notes to questions
- Consider regulatory requirements

## Getting Help

- Open an issue for bugs or feature requests
- Check existing documentation
- Review closed issues for similar problems

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for any questions about contributing!
