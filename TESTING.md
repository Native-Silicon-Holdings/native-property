# Testing Guide

This document provides comprehensive information about testing the Estate Management Platform.

## Overview

The platform includes extensive test coverage for both backend and frontend:
- **Backend**: Jest + Supertest for unit and integration tests
- **Frontend**: Vitest + React Testing Library for component tests
- **Coverage**: Automated coverage reporting
- **CI/CD**: Automated testing on every push/PR

## Backend Testing

### Setup

```bash
cd backend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

### Test Structure

```
backend/src/__tests__/
├── setup.ts                    # Test configuration
├── utils/
│   ├── password.test.ts       # Password utility tests
│   └── jwt.test.ts            # JWT utility tests
└── integration/
    └── auth.test.ts           # Authentication API tests
```

### Writing Tests

#### Unit Test Example

```typescript
import { hashPassword, comparePassword } from '../../utils/password.util';

describe('Password Utilities', () => {
  it('should hash a password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });

  it('should verify correct password', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    const isValid = await comparePassword(password, hash);
    
    expect(isValid).toBe(true);
  });
});
```

#### Integration Test Example

```typescript
import request from 'supertest';
import app from '../../index';

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

```bash
# View coverage report
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Test Configuration

`jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

## Frontend Testing

### Setup

```bash
cd frontend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run in UI mode (interactive)
npm run test:ui

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- Login.test.tsx
```

### Test Structure

```
frontend/src/__tests__/
├── setup.ts                    # Test configuration
├── components/
│   └── Login.test.tsx         # Login component tests
└── utils/
    └── api.test.ts            # API utility tests
```

### Writing Tests

#### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/auth/Login';

describe('Login Component', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should validate email input', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });
});
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:
```bash
# View coverage report
npm run test:coverage
open coverage/index.html
```

### Test Configuration

`vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
  },
});
```

## Continuous Integration

### GitHub Actions Workflow

Tests run automatically on every push and pull request:

```yaml
name: CI Pipeline

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
```

### Test Reports

Test results are available in:
- GitHub Actions summary
- Pull request checks
- Coverage reports (if configured)

## Test Data Management

### Mocking Prisma

`backend/src/__tests__/setup.ts`:
```typescript
jest.mock('../services/prisma.service', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      // ... other methods
    },
  },
}));
```

### Test Database

For integration tests, use a separate test database:

```env
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/estate_management_test"
```

## Best Practices

### General

1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests isolated and independent**
5. **Mock external dependencies**
6. **Maintain high coverage** (70%+ minimum)

### Backend

1. **Unit test utilities** separately from API
2. **Mock database** for unit tests
3. **Use test database** for integration tests
4. **Test error cases** and edge cases
5. **Verify security** (auth, permissions)

### Frontend

1. **Test user interactions**
2. **Mock API calls**
3. **Test accessibility**
4. **Test error states**
5. **Use data-testid** for complex queries

## Common Testing Patterns

### Testing Async Functions

```typescript
it('should handle async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Testing API Endpoints

```typescript
it('should return 401 for invalid credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'wrong@example.com', password: 'wrong' });

  expect(response.status).toBe(401);
});
```

### Testing React Hooks

```typescript
it('should update state on input change', () => {
  const { result } = renderHook(() => useForm());
  
  act(() => {
    result.current.setValue('email', 'test@example.com');
  });

  expect(result.current.values.email).toBe('test@example.com');
});
```

## Debugging Tests

### Backend

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Add breakpoints in VS Code
# Add to launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Frontend

```bash
# Run tests in UI mode for debugging
npm run test:ui

# Or use browser debugger
# Add 'debugger;' statement in test
npm test -- --inspect-brk
```

## Makefile Shortcuts

```bash
# Run all tests
make test

# Run backend tests only
make test-backend

# Run frontend tests only
make test-frontend

# Run tests with coverage
make test-coverage

# Run linters
make lint
```

## Troubleshooting

### Tests Failing Locally

1. Clear test cache:
```bash
cd backend && npm test -- --clearCache
cd frontend && npm test -- --clearCache
```

2. Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

3. Check environment variables:
```bash
# Backend
cat backend/.env.test

# Frontend
cat frontend/.env.test
```

### Tests Pass Locally but Fail in CI

1. Check Node version matches CI
2. Verify database configuration
3. Check for timezone issues
4. Review CI logs for specifics

### Slow Tests

1. Run specific tests:
```bash
npm test -- auth.test.ts
```

2. Increase timeout:
```javascript
jest.setTimeout(10000);
```

3. Use test database for integration tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

**Quick Reference**

| Task | Backend | Frontend |
|------|---------|----------|
| Run tests | `npm test` | `npm test` |
| Watch mode | `npm test -- --watch` | `npm test -- --watch` |
| Coverage | `npm test -- --coverage` | `npm run test:coverage` |
| UI mode | N/A | `npm run test:ui` |
| Specific file | `npm test -- <file>` | `npm test -- <file>` |
