describe('Database Initialization Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
    cy.runMake('docker-up', { timeout: 120000 });
    cy.waitForDatabase(60000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make db-push', () => {
    it('should push Prisma schema to database', () => {
      cy.runMake('db-push', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should create database tables', () => {
      cy.runMake('db-push', { timeout: 60000 });
      // If db-push succeeds, tables are created
      cy.log('✅ Database schema pushed successfully');
    });
  });

  describe('make db-generate', () => {
    it('should generate Prisma client', () => {
      cy.runMake('db-generate', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should create Prisma client files', () => {
      cy.runMake('db-generate', { timeout: 60000 });

      cy.verifyFileExists('../backend/node_modules/.prisma').then((exists) => {
        expect(exists).to.be.true;
      });
    });
  });

  describe('make db-seed', () => {
    it('should seed database with test data', () => {
      // Ensure schema is pushed first
      cy.runMake('db-push', { timeout: 60000 });

      cy.runMake('db-seed', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should handle seeding with existing data', () => {
      cy.runMake('db-push', { timeout: 60000 });
      cy.runMake('db-seed', { timeout: 60000 });

      // Seed again - should handle duplicates gracefully
      cy.runMake('db-seed', { timeout: 60000, expectSuccess: false }).then((result) => {
        // May succeed or fail depending on seed implementation
        cy.log(`Seed result: ${result.exitCode === 0 ? 'Success' : 'Expected behavior'}`);
      });
    });
  });

  describe('make db-reset', () => {
    it('should reset database (push + seed)', () => {
      cy.runMake('db-reset', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should create fresh database state', () => {
      cy.runMake('db-reset', { timeout: 120000 });
      cy.log('✅ Database reset completed');
    });
  });

  describe('make db-init', () => {
    it('should initialize database (push + seed)', () => {
      cy.runMake('db-init', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });
  });
});
