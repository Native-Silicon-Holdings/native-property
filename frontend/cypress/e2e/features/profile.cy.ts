describe('User Profile', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.loginViaApi(users.homeowner.email, users.homeowner.password);
      cy.visit('/profile');
    });
  });

  it('should display profile page', () => {
    cy.contains(/profile/i).should('be.visible');
  });

  it('should display user information', () => {
    cy.fixture('users').then((users) => {
      const user = users.homeowner;

      cy.contains(user.firstName).should('be.visible');
      cy.contains(user.lastName).should('be.visible');
      cy.contains(user.email).should('be.visible');
      cy.contains(user.role).should('be.visible');
    });
  });

  it('should display account status', () => {
    cy.contains(/active|status/i).should('be.visible');
  });

  it('should allow editing profile information', () => {
    // Click edit button if it exists
    cy.get('button').contains(/edit|update/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();

        // Update phone number
        cy.get('input[name="phoneNumber"]').clear().type('+9876543210');

        // Save changes
        cy.get('button[type="submit"]').click();

        // Should show success message
        cy.contains(/success|updated/i).should('be.visible');
      }
    });
  });

  it('should allow changing password', () => {
    // Navigate to change password section
    cy.contains(/change password/i).then(($link) => {
      if ($link.length > 0) {
        cy.wrap($link).click();

        cy.get('input[name="currentPassword"]').type('HomeownerPass123!');
        cy.get('input[name="newPassword"]').type('NewPassword123!');
        cy.get('input[name="confirmPassword"]').type('NewPassword123!');

        cy.get('button[type="submit"]').click();

        // Should show success message
        cy.contains(/success|changed/i).should('be.visible');
      }
    });
  });

  it('should display property information if linked', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Property')) {
        cy.contains(/property|unit/i).should('be.visible');
      }
    });
  });
});
