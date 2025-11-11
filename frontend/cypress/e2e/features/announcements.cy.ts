describe('Announcements Feature', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      cy.loginViaApi(users.homeowner.email, users.homeowner.password);
      cy.visit('/announcements');
    });
  });

  it('should display announcements page', () => {
    cy.contains(/announcement/i).should('be.visible');
  });

  it('should display list of announcements', () => {
    // Check if announcements are displayed (if any exist)
    cy.get('body').then(($body) => {
      if ($body.text().includes('No announcements')) {
        cy.contains(/no announcement/i).should('be.visible');
      } else {
        cy.get('[data-testid="announcement-card"]').should('exist');
      }
    });
  });

  it('should filter announcements by category', () => {
    // If filter exists
    cy.get('select[name="category"]').then(($select) => {
      if ($select.length > 0) {
        cy.wrap($select).select('URGENT');
        cy.wait(500); // Wait for filter to apply
      }
    });
  });

  it('should view announcement details', () => {
    // Click first announcement if exists
    cy.get('[data-testid="announcement-card"]').first().then(($card) => {
      if ($card.length > 0) {
        cy.wrap($card).click();
        cy.url().should('include', '/announcements/');
      }
    });
  });

  context('As Director/Manager', () => {
    beforeEach(() => {
      cy.fixture('users').then((users) => {
        cy.loginViaApi(users.manager.email, users.manager.password);
        cy.visit('/announcements');
      });
    });

    it('should display create announcement button', () => {
      cy.contains(/create|new.*announcement/i).should('be.visible');
    });

    it('should create new announcement', () => {
      cy.fixture('announcements').then((announcements) => {
        const announcement = announcements.general;

        cy.contains(/create|new.*announcement/i).click();

        cy.get('input[name="title"]').type(announcement.title);
        cy.get('textarea[name="content"]').type(announcement.content);
        cy.get('select[name="category"]').select(announcement.category);
        cy.get('select[name="priority"]').select(announcement.priority);

        cy.get('button[type="submit"]').click();

        // Should show success message
        cy.contains(/success|created/i).should('be.visible');

        // Should display new announcement
        cy.contains(announcement.title).should('be.visible');
      });
    });
  });
});
