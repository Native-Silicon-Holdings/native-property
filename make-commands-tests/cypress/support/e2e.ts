// Import commands
import './commands';

// Configure Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions from the application
  return false;
});

// Global before hook
before(() => {
  cy.log('🚀 Starting Make Commands Test Suite');
  cy.log(`Environment: ${Cypress.env('NODE_ENV') || 'test'}`);
  cy.log(`Project Root: ${Cypress.env('PROJECT_ROOT')}`);
});

// Global after hook
after(() => {
  cy.log('✅ Test Suite Complete');
});
