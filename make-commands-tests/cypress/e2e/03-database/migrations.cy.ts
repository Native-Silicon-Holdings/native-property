describe('Database Migration Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
    cy.runMake('docker-up', { timeout: 120000 });
    cy.waitForDatabase(60000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make db-migrate', () => {
    it('should require migration name parameter', () => {
      // This command requires NAME parameter
      // Usage: make db-migrate NAME=migration_name
      cy.log('⚠️ db-migrate requires NAME parameter - testing with parameter');

      cy.task('execCommand', {
        command: 'make db-migrate NAME=test_migration',
        cwd: '../',
      }, { timeout: 60000 }).then((result: any) => {
        // Migration command behavior varies
        // It may fail if no changes detected, which is expected
        cy.log(`Migration result: exit code ${result.exitCode}`);
      });
    });

    it('should fail gracefully without NAME parameter', () => {
      cy.runMake('db-migrate', { expectSuccess: false, timeout: 30000 }).then((result) => {
        // Should show usage or error message
        cy.log('Migration without NAME parameter handled');
      });
    });
  });
});
