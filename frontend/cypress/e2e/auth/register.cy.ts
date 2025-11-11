describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('should display registration form', () => {
    cy.contains('Create your account').should('be.visible');
    cy.get('input[name="firstName"]').should('be.visible');
    cy.get('input[name="lastName"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="phoneNumber"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="confirmPassword"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Create account');
  });

  it('should show validation errors for empty required fields', () => {
    cy.get('button[type="submit"]').click();

    // HTML5 validation
    cy.get('input[name="firstName"]:invalid').should('exist');
    cy.get('input[name="lastName"]:invalid').should('exist');
    cy.get('input[name="email"]:invalid').should('exist');
    cy.get('input[name="password"]:invalid').should('exist');
  });

  it('should show error for invalid email format', () => {
    cy.get('input[name="email"]').type('invalidemail');
    cy.get('input[name="email"]:invalid').should('exist');
  });

  it('should show error when passwords do not match', () => {
    cy.fixture('users').then((users) => {
      const user = users.newUser;

      cy.get('input[name="firstName"]').type(user.firstName);
      cy.get('input[name="lastName"]').type(user.lastName);
      cy.get('input[name="email"]').type(user.email);
      cy.get('input[name="password"]').type(user.password);
      cy.get('input[name="confirmPassword"]').type('DifferentPassword123!');
      cy.get('button[type="submit"]').click();

      // Should show password mismatch error
      cy.contains(/password.*match/i).should('be.visible');
    });
  });

  it('should show error for weak password', () => {
    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('weak');
    cy.get('input[name="confirmPassword"]').type('weak');
    cy.get('button[type="submit"]').click();

    // Should show weak password error
    cy.contains(/password.*8.*character/i).should('be.visible');
  });

  it('should successfully register with valid data', () => {
    const timestamp = Date.now();
    const uniqueEmail = `user${timestamp}@example.com`;

    cy.get('input[name="firstName"]').type('Test');
    cy.get('input[name="lastName"]').type('User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="phoneNumber"]').type('+1234567890');
    cy.get('input[name="password"]').type('TestPass123!');
    cy.get('input[name="confirmPassword"]').type('TestPass123!');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard after successful registration
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Should store token
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });
  });

  it('should navigate to login page', () => {
    cy.contains('Sign in instead').click();
    cy.url().should('include', '/login');
  });

  it('should show error for existing email', () => {
    cy.fixture('users').then((users) => {
      const user = users.homeowner;

      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(user.email); // Existing email
      cy.get('input[name="password"]').type('TestPass123!');
      cy.get('input[name="confirmPassword"]').type('TestPass123!');
      cy.get('button[type="submit"]').click();

      // Should show error about existing email
      cy.contains(/email.*exist|already.*register/i).should('be.visible');
    });
  });
});
