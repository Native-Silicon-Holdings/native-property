describe('Dashboard Navigation', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.loginViaApi(users.homeowner.email, users.homeowner.password);
      cy.visit('/dashboard');
    });
  });

  it('should display dashboard with welcome message', () => {
    cy.contains(/welcome back/i).should('be.visible');
  });

  it('should display navigation sidebar', () => {
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Documents').should('be.visible');
    cy.contains('Announcements').should('be.visible');
    cy.contains('Meetings').should('be.visible');
    cy.contains('Utilities').should('be.visible');
    cy.contains('Maintenance').should('be.visible');
  });

  it('should navigate to documents page', () => {
    cy.contains('Documents').click();
    cy.url().should('include', '/documents');
    cy.contains(/document/i).should('be.visible');
  });

  it('should navigate to announcements page', () => {
    cy.contains('Announcements').click();
    cy.url().should('include', '/announcements');
  });

  it('should navigate to meetings page', () => {
    cy.contains('Meetings').click();
    cy.url().should('include', '/meetings');
  });

  it('should navigate to utilities page', () => {
    cy.contains('Utilities').click();
    cy.url().should('include', '/utilities');
  });

  it('should navigate to maintenance page', () => {
    cy.contains('Maintenance').click();
    cy.url().should('include', '/maintenance');
  });

  it('should display user profile in header', () => {
    cy.fixture('users').then((users) => {
      const user = users.homeowner;
      cy.contains(user.firstName).should('be.visible');
    });
  });

  it('should open user menu and navigate to profile', () => {
    // Click user menu
    cy.get('button').contains(/john|user/i).click();

    // Click profile link
    cy.contains('Profile Settings').click();
    cy.url().should('include', '/profile');
  });

  it('should logout successfully', () => {
    // Open user menu
    cy.get('button').contains(/john|user/i).click();

    // Click logout
    cy.contains('Logout').click();

    // Should redirect to login
    cy.url().should('include', '/login');

    // Token should be removed
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.not.exist;
    });
  });

  it('should display dashboard statistics', () => {
    // Check for stat cards
    cy.contains(/announcements/i).should('be.visible');
    cy.contains(/meetings/i).should('be.visible');
    cy.contains(/maintenance/i).should('be.visible');
  });

  it('should be responsive on mobile', () => {
    // Test mobile viewport
    cy.viewport('iphone-x');

    // Sidebar should be hidden on mobile
    cy.get('aside').should('not.be.visible');

    // Menu button should be visible
    cy.get('button[aria-label*="menu"]').should('be.visible');
  });
});
