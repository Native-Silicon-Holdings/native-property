# End-to-End Testing with Cypress

This document provides comprehensive information about E2E testing for the Estate Management Platform using Cypress.

## Overview

Cypress is used for end-to-end testing to simulate real user interactions and test the complete application flow from frontend to backend.

**Features:**
- ✅ Real browser testing (Chrome, Firefox, Edge, Electron)
- ✅ Automatic waiting and retry logic
- ✅ Time-travel debugging
- ✅ Network stubbing and mocking
- ✅ Video recording and screenshots
- ✅ CI/CD integration

## Installation

Cypress is already configured in the project. To install dependencies:

```bash
cd frontend
npm install
```

## Running Tests

### Interactive Mode (Development)

Open the Cypress Test Runner for interactive testing:

```bash
# From frontend directory
npm run cypress

# Or from root with Makefile
make test-e2e-open
```

This opens the Cypress GUI where you can:
- Select and run individual tests
- See tests run in real-time
- Debug with time-travel
- Inspect DOM snapshots

### Headless Mode (CI/CD)

Run all tests in headless mode:

```bash
# From frontend directory
npm run test:e2e:headless

# Or from root with Makefile
make test-e2e
```

### With Server Auto-Start

Tests automatically start the dev server:

```bash
# Starts dev server, waits for it, then runs tests
npm run test:e2e
```

## Test Structure

```
frontend/cypress/
├── e2e/                      # Test files
│   ├── auth/
│   │   ├── login.cy.ts      # Login flow tests
│   │   └── register.cy.ts   # Registration tests
│   ├── dashboard/
│   │   └── navigation.cy.ts # Dashboard navigation
│   ├── features/
│   │   ├── announcements.cy.ts  # Announcements feature
│   │   └── profile.cy.ts    # User profile tests
│   └── accessibility/
│       └── a11y.cy.ts       # Accessibility tests
├── fixtures/                 # Test data
│   ├── users.json           # User test data
│   └── announcements.json   # Announcement test data
├── support/                  # Support files
│   ├── commands.ts          # Custom commands
│   └── e2e.ts              # Global config
└── cypress.config.ts         # Cypress configuration
```

## Writing Tests

### Basic Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    cy.visit('/path');
  });

  it('should do something', () => {
    // Test implementation
    cy.get('selector').should('be.visible');
  });
});
```

### Using Fixtures

```typescript
describe('Login', () => {
  it('should login with valid credentials', () => {
    cy.fixture('users').then((users) => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(users.homeowner.email);
      cy.get('input[name="password"]').type(users.homeowner.password);
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
    });
  });
});
```

### Custom Commands

The project includes custom Cypress commands for common operations:

#### Login via UI
```typescript
cy.login('user@example.com', 'password123');
```

#### Login via API (faster for setup)
```typescript
cy.loginViaApi('user@example.com', 'password123');
cy.visit('/dashboard');
```

#### Register User
```typescript
cy.register({
  email: 'new@example.com',
  password: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
});
```

#### Get by Test ID
```typescript
cy.getByTestId('submit-button').click();
```

## Custom Commands Reference

All custom commands are defined in `cypress/support/commands.ts`:

| Command | Description | Example |
|---------|-------------|---------|
| `cy.login(email, password)` | Login via UI | `cy.login('user@test.com', 'pass123')` |
| `cy.loginViaApi(email, password)` | Login via API (faster) | `cy.loginViaApi('user@test.com', 'pass123')` |
| `cy.register(userData)` | Register new user | `cy.register({...userData})` |
| `cy.getByTestId(id)` | Get element by test ID | `cy.getByTestId('header')` |
| `cy.seedDatabase()` | Seed test data | `cy.seedDatabase()` |
| `cy.clearDatabase()` | Clear test data | `cy.clearDatabase()` |

## Test Examples

### Authentication Test

```typescript
describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome back').should('be.visible');
  });
});
```

### Navigation Test

```typescript
describe('Dashboard Navigation', () => {
  beforeEach(() => {
    cy.loginViaApi('user@example.com', 'password123');
    cy.visit('/dashboard');
  });

  it('should navigate to documents', () => {
    cy.contains('Documents').click();
    cy.url().should('include', '/documents');
  });
});
```

### Form Submission Test

```typescript
describe('Create Announcement', () => {
  beforeEach(() => {
    cy.loginViaApi('manager@example.com', 'password123');
    cy.visit('/announcements');
  });

  it('should create new announcement', () => {
    cy.contains('Create').click();

    cy.get('input[name="title"]').type('Test Announcement');
    cy.get('textarea[name="content"]').type('Test content');
    cy.get('select[name="category"]').select('GENERAL');
    cy.get('button[type="submit"]').click();

    cy.contains('success', { matchCase: false }).should('be.visible');
    cy.contains('Test Announcement').should('be.visible');
  });
});
```

### API Testing

```typescript
describe('API Tests', () => {
  it('should return user profile', () => {
    cy.loginViaApi('user@example.com', 'password123');

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/auth/profile`,
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem('token')}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.data).to.have.property('email');
    });
  });
});
```

## Best Practices

### 1. Use Data Attributes

Add `data-testid` attributes to elements:

```tsx
<button data-testid="submit-button">Submit</button>
```

Then select them in tests:

```typescript
cy.getByTestId('submit-button').click();
```

### 2. Avoid Hard-Coded Waits

❌ Bad:
```typescript
cy.wait(5000);
```

✅ Good:
```typescript
cy.get('.loader').should('not.exist');
cy.contains('Data loaded').should('be.visible');
```

### 3. Use Fixtures for Test Data

```typescript
cy.fixture('users').then((users) => {
  // Use users data
});
```

### 4. Login via API for Speed

❌ Slow:
```typescript
beforeEach(() => {
  cy.visit('/login');
  cy.get('input[name="email"]').type('user@test.com');
  cy.get('input[name="password"]').type('password');
  cy.get('button').click();
});
```

✅ Fast:
```typescript
beforeEach(() => {
  cy.loginViaApi('user@test.com', 'password');
  cy.visit('/dashboard');
});
```

### 5. Clean Up Between Tests

```typescript
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});
```

### 6. Use Descriptive Test Names

```typescript
it('should display error message when login fails with invalid credentials', () => {
  // Test code
});
```

## Configuration

### Cypress Configuration (`cypress.config.ts`)

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
  },
  env: {
    apiUrl: 'http://localhost:5000/api',
  },
});
```

### Environment Variables

Create `cypress.env.json` for environment-specific config:

```json
{
  "apiUrl": "http://localhost:5000/api",
  "testUser": "test@example.com",
  "testPassword": "password123"
}
```

Access in tests:

```typescript
const apiUrl = Cypress.env('apiUrl');
```

## CI/CD Integration

### GitHub Actions

Tests run automatically in CI via GitHub Actions:

```yaml
- name: Run Cypress E2E tests
  uses: cypress-io/github-action@v6
  with:
    working-directory: frontend
    start: npm run dev
    wait-on: 'http://localhost:3000'
    browser: chrome
```

### Artifacts

Test artifacts are uploaded on failure:
- Screenshots (on test failure)
- Videos (all tests)
- Available in GitHub Actions artifacts

## Debugging

### Interactive Debugging

```typescript
it('should do something', () => {
  cy.get('button').click();
  cy.pause(); // Pause test execution
  cy.get('result').should('be.visible');
});
```

### Console Logging

```typescript
cy.get('button').then(($btn) => {
  console.log('Button:', $btn);
});
```

### Time-Travel

In Cypress Test Runner:
- Click on command to see DOM snapshot
- Hover over command to highlight element
- Use browser DevTools

## Troubleshooting

### Test Timeout

```typescript
// Increase timeout for specific command
cy.get('.slow-element', { timeout: 20000 }).should('be.visible');

// Or globally in config
defaultCommandTimeout: 20000
```

### Element Not Found

```typescript
// Wait for element to exist
cy.get('selector').should('exist');

// Wait for element to be visible
cy.get('selector').should('be.visible');

// Use contains for text matching
cy.contains('Button Text').click();
```

### Flaky Tests

```typescript
// Add retries in config
retries: {
  runMode: 2,    // Retry 2 times in CI
  openMode: 0,   // Don't retry in interactive mode
}
```

### Network Issues

```typescript
// Intercept and stub network requests
cy.intercept('GET', '/api/announcements', {
  fixture: 'announcements.json'
}).as('getAnnouncements');

cy.visit('/announcements');
cy.wait('@getAnnouncements');
```

## Video and Screenshots

### Videos

Videos are recorded by default in headless mode:
- Location: `cypress/videos/`
- Controlled in `cypress.config.ts`

```typescript
video: true,  // Enable/disable video recording
```

### Screenshots

Screenshots are captured on test failure:
- Location: `cypress/screenshots/`
- Manual screenshots:

```typescript
cy.screenshot('my-screenshot');
cy.get('.element').screenshot();
```

## Accessibility Testing

Basic accessibility test included:

```typescript
describe('Accessibility', () => {
  it('should be accessible', () => {
    cy.visit('/login');
    // Add cypress-axe for automated a11y testing
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

To enable:
```bash
npm install --save-dev cypress-axe axe-core
```

## Performance Testing

```typescript
describe('Performance', () => {
  it('should load dashboard quickly', () => {
    const start = Date.now();

    cy.visit('/dashboard');
    cy.get('[data-testid="dashboard"]').should('be.visible');

    const loadTime = Date.now() - start;
    expect(loadTime).to.be.lessThan(3000);
  });
});
```

## Makefile Commands

```bash
# Run E2E tests in headless mode
make test-e2e

# Open Cypress Test Runner
make test-e2e-open

# Run all tests (unit + integration + E2E)
make test
```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Examples](https://example.cypress.io/)
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)

---

## Quick Reference

| Task | Command |
|------|---------|
| Open Cypress | `npm run cypress` |
| Run headless | `npm run test:e2e:headless` |
| Run with server | `npm run test:e2e` |
| View videos | `cypress/videos/` |
| View screenshots | `cypress/screenshots/` |
| Add test | Create file in `cypress/e2e/` |
| Add fixture | Create file in `cypress/fixtures/` |
| Add command | Edit `cypress/support/commands.ts` |

**Test Coverage:**
- ✅ Authentication (Login, Register, Logout)
- ✅ Dashboard Navigation
- ✅ User Profile
- ✅ Announcements Feature
- ✅ Accessibility Checks
- 🚧 More tests can be added as features are developed
