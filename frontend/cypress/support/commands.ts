/// <reference types="cypress" />

// ***********************************************
// Custom commands for Estate Management Platform
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login user
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to register user
       * @example cy.register({email: 'test@example.com', password: 'password123', firstName: 'John', lastName: 'Doe'})
       */
      register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
      }): Chainable<void>;

      /**
       * Custom command to login via API and set token
       * @example cy.loginViaApi('test@example.com', 'password123')
       */
      loginViaApi(email: string, password: string): Chainable<void>;

      /**
       * Custom command to get by data-testid
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(selector: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to seed database with test data
       * @example cy.seedDatabase()
       */
      seedDatabase(): Chainable<void>;

      /**
       * Custom command to clear database
       * @example cy.clearDatabase()
       */
      clearDatabase(): Chainable<void>;
    }
  }
}

/**
 * Login via UI
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();

  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard');
  cy.window().then((win) => {
    expect(win.localStorage.getItem('token')).to.exist;
  });
});

/**
 * Register via UI
 */
Cypress.Commands.add('register', (userData) => {
  cy.visit('/register');
  cy.get('input[name="firstName"]').type(userData.firstName);
  cy.get('input[name="lastName"]').type(userData.lastName);
  cy.get('input[name="email"]').type(userData.email);
  if (userData.phoneNumber) {
    cy.get('input[name="phoneNumber"]').type(userData.phoneNumber);
  }
  cy.get('input[name="password"]').type(userData.password);
  cy.get('input[name="confirmPassword"]').type(userData.password);
  cy.get('button[type="submit"]').click();

  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard');
});

/**
 * Login via API - faster for test setup
 */
Cypress.Commands.add('loginViaApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.data.token).to.exist;

    // Store token and user in localStorage
    window.localStorage.setItem('token', response.body.data.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
  });
});

/**
 * Get element by data-testid attribute
 */
Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`);
});

/**
 * Seed database with test data
 */
Cypress.Commands.add('seedDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    failOnStatusCode: false,
  });
});

/**
 * Clear database
 */
Cypress.Commands.add('clearDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/clear`,
    failOnStatusCode: false,
  });
});

// Prevent TypeScript errors
export {};
