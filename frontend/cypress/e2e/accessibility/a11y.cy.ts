describe('Accessibility Tests', () => {
  it('login page should be accessible', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('dashboard should be accessible', () => {
    cy.fixture('users').then((users) => {
      cy.loginViaApi(users.homeowner.email, users.homeowner.password);
      cy.visit('/dashboard');
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  it('should have proper heading hierarchy', () => {
    cy.visit('/login');

    cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
      expect($headings.length).to.be.greaterThan(0);
    });
  });

  it('should have proper alt text for images', () => {
    cy.visit('/login');

    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });

  it('should have proper ARIA labels for interactive elements', () => {
    cy.visit('/login');

    cy.get('button, a, input').each(($el) => {
      const tagName = $el.prop('tagName').toLowerCase();
      const type = $el.attr('type');

      // Buttons and links should have accessible names
      if (tagName === 'button' || tagName === 'a') {
        const hasText = $el.text().trim().length > 0;
        const hasAriaLabel = $el.attr('aria-label');
        const hasAriaLabelledBy = $el.attr('aria-labelledby');

        expect(hasText || hasAriaLabel || hasAriaLabelledBy).to.be.true;
      }

      // Form inputs should have labels
      if (tagName === 'input' && type !== 'hidden') {
        const id = $el.attr('id');
        const hasLabel = id && cy.get(`label[for="${id}"]`).should('exist');
        const hasAriaLabel = $el.attr('aria-label');

        expect(hasLabel || hasAriaLabel).to.exist;
      }
    });
  });

  it('should be keyboard navigable', () => {
    cy.visit('/login');

    // Tab through form elements
    cy.get('input[name="email"]').focus();
    cy.focused().should('have.attr', 'name', 'email');

    cy.realPress('Tab');
    cy.focused().should('have.attr', 'name', 'password');

    cy.realPress('Tab');
    cy.focused().should('have.attr', 'type', 'checkbox');
  });
});

// Note: This requires cypress-axe plugin
// Install: npm install --save-dev cypress-axe axe-core
// Add to cypress/support/e2e.ts: import 'cypress-axe';
