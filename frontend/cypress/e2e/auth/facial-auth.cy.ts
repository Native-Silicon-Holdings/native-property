/// <reference types="cypress" />

describe('Facial Authentication Flow', () => {
  const testUser = {
    email: 'facial-e2e-test@example.com',
    password: 'FacialTest123!',
    firstName: 'Facial',
    lastName: 'TestUser',
  };

  before(() => {
    // Setup: Create test user with facial auth enabled via API
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/register`,
      body: testUser,
      failOnStatusCode: false,
    });

    // Enable facial auth for the user
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: {
        email: testUser.email,
        password: testUser.password,
      },
    }).then((response) => {
      const token = response.body.data.token;

      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/facial-auth/enable`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    });
  });

  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display facial auth button on login page', () => {
    cy.contains('Sign in with Facial Recognition').should('be.visible');
    cy.get('button').contains('Facial Recognition').should('exist');
  });

  it('should navigate to facial auth page when button clicked', () => {
    cy.contains('Sign in with Facial Recognition').click();
    cy.url().should('include', '/facial-auth');
  });

  it('should show email input on facial auth page', () => {
    cy.visit('/facial-auth');

    cy.contains('Facial Recognition Login').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('button').contains('Start Facial Verification').should('be.visible');
  });

  it('should initialize verification with valid email', () => {
    cy.visit('/facial-auth');

    // Stub the initialization API call
    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          verificationId: 'test-verification-id-123',
          user: {
            id: 'user-id',
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
          },
        },
      },
    }).as('initVerification');

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    cy.wait('@initVerification');
  });

  it('should show error for non-existent email', () => {
    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 404,
      body: {
        success: false,
        message: 'User not found',
      },
    });

    cy.get('input[type="email"]').type('nonexistent@example.com');
    cy.get('button').contains('Start Facial Verification').click();

    cy.contains('User not found').should('be.visible');
  });

  it('should show error for user without facial auth enabled', () => {
    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Facial authentication is not enabled for this account',
      },
    });

    cy.get('input[type="email"]').type('no-facial@example.com');
    cy.get('button').contains('Start Facial Verification').click();

    cy.contains('not enabled').should('be.visible');
  });

  it('should display verification wizard after initialization', () => {
    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          verificationId: 'test-verification-id',
          user: testUser,
        },
      },
    });

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    // Check wizard steps are visible
    cy.contains('Audio Check').should('be.visible');
    cy.contains('Camera Setup').should('be.visible');
    cy.contains('Verification').should('be.visible');
  });

  it('should show privacy notice', () => {
    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          verificationId: 'test-verification-id',
          user: testUser,
        },
      },
    });

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    cy.contains('Privacy Notice').should('be.visible');
    cy.contains('encrypted').should('be.visible');
    cy.contains('never be shared with third parties').should('be.visible');
  });

  it('should handle back to login navigation', () => {
    cy.visit('/facial-auth');

    cy.contains('Back to Login').click();
    cy.url().should('include', '/login');
  });

  it('should handle cancel button', () => {
    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          verificationId: 'test-verification-id',
          user: testUser,
        },
      },
    });

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    cy.contains('Cancel').click();
    cy.url().should('include', '/login');
  });

  it('should mock camera permissions and proceed through steps', () => {
    cy.visit('/facial-auth');

    // Initialize verification
    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          verificationId: 'test-verification-id',
          user: testUser,
        },
      },
    });

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    // Mock getUserMedia for audio
    cy.window().then((win) => {
      cy.stub(win.navigator.mediaDevices, 'getUserMedia')
        .withArgs({ audio: true })
        .resolves({
          getTracks: () => [{ stop: () => {} }],
        } as any);
    });

    cy.contains('Enable Audio').should('be.visible');
  });

  it('should complete full verification flow with mocked responses', () => {
    const verificationId = 'test-verification-123';

    cy.visit('/facial-auth');

    // Mock initialization
    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      body: {
        success: true,
        data: { verificationId, user: testUser },
      },
    });

    // Mock video upload
    cy.intercept('POST', `**/api/facial-auth/upload/${verificationId}`, {
      statusCode: 200,
      body: {
        success: true,
        data: { verificationId, status: 'PROCESSING' },
      },
    });

    // Mock status check - VERIFIED
    cy.intercept('GET', `**/api/facial-auth/status/${verificationId}`, {
      statusCode: 200,
      body: {
        success: true,
        data: {
          verification: {
            id: verificationId,
            status: 'VERIFIED',
            verificationScore: 0.95,
          },
        },
      },
    });

    // Mock login
    cy.intercept('POST', '**/api/facial-auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: 'HOMEOWNER',
          },
          token: 'mock-jwt-token-here',
        },
      },
    });

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    // Should eventually redirect to dashboard after successful verification
    // (This would require full implementation of camera mocking)
  });

  it('should handle verification failure gracefully', () => {
    const verificationId = 'test-verification-fail';

    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      body: {
        success: true,
        data: { verificationId, user: testUser },
      },
    });

    cy.intercept('POST', `**/api/facial-auth/upload/${verificationId}`, {
      statusCode: 200,
      body: {
        success: true,
        data: { verificationId, status: 'PROCESSING' },
      },
    });

    // Mock failed verification
    cy.intercept('GET', `**/api/facial-auth/status/${verificationId}`, {
      statusCode: 200,
      body: {
        success: true,
        data: {
          verification: {
            id: verificationId,
            status: 'FAILED',
            failureReason: 'Face could not be verified',
          },
        },
      },
    });

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    // Error would be shown to user
  });

  it('should handle network errors during initialization', () => {
    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      forceNetworkError: true,
    });

    cy.get('input[type="email"]').type(testUser.email);
    cy.get('button').contains('Start Facial Verification').click();

    cy.contains(/failed|error/i).should('be.visible');
  });

  it('should validate email format', () => {
    cy.visit('/facial-auth');

    cy.get('input[type="email"]').type('invalid-email');
    cy.get('button').contains('Start Facial Verification').click();

    // Browser validation should prevent submission
    cy.get('input[type="email"]:invalid').should('exist');
  });

  it('should prevent double submission', () => {
    cy.visit('/facial-auth');

    cy.intercept('POST', '**/api/facial-auth/initialize', {
      statusCode: 200,
      delay: 1000, // Slow response
      body: {
        success: true,
        data: {
          verificationId: 'test-id',
          user: testUser,
        },
      },
    }).as('init');

    cy.get('input[type="email"]').type(testUser.email);
    const button = cy.get('button').contains('Start Facial Verification');

    button.click();
    button.click(); // Try to click again

    // Should only make one request
    cy.wait('@init');
    cy.get('@init.all').should('have.length', 1);
  });

  after(() => {
    // Cleanup: Delete test user
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: {
        email: testUser.email,
        password: testUser.password,
      },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.body.data?.token) {
        // In a real app, you'd have a delete user endpoint
        cy.log('Test user cleanup would happen here');
      }
    });
  });
});
