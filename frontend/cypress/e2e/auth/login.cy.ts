describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.contains('Estate Management Platform').should('be.visible');
    cy.contains('Sign in to your account').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign in');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();

    // HTML5 validation will prevent submission
    cy.get('input[name="email"]:invalid').should('exist');
    cy.get('input[name="password"]:invalid').should('exist');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains(/invalid|incorrect|failed/i).should('be.visible');
  });

  it('should successfully login with valid credentials', () => {
    cy.fixture('users').then((users) => {
      const user = users.homeowner;

      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type(user.password);
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Should store token in localStorage
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.exist;
        expect(win.localStorage.getItem('user')).to.exist;
      });

      // Should display user name
      cy.contains(user.firstName).should('be.visible');
    });
  });

  it('should navigate to register page', () => {
    cy.contains('Create new account').click();
    cy.url().should('include', '/register');
  });

  it('should toggle password visibility', () => {
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');

    // If there's a show/hide password button
    cy.get('button[aria-label*="password"]').then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();
        cy.get('input[name="password"]').should('have.attr', 'type', 'text');
      }
    });
  });

  it('should persist remember me selection', () => {
    cy.get('input[type="checkbox"][name="remember-me"]').check();
    cy.get('input[type="checkbox"][name="remember-me"]').should('be.checked');
  });
});
