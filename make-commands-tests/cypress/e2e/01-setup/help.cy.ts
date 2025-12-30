describe('Make Command: help', () => {
  it('should display help menu with all commands', () => {
    cy.runMake('help').then((result) => {
      expect(result.success).to.be.true;
      expect(result.exitCode).to.equal(0);

      // Verify help output contains key sections
      cy.verifyOutput(result.output, [
        'Native Property Management Platform',
        'Quick Start',
        'Docker',
        'Database',
        'Testing',
        'Development',
        'Build',
      ]);

      // Verify essential commands are listed
      cy.verifyOutput(result.output, [
        'make help',
        'make setup',
        'make start',
        'make stop',
        'make test',
        'make build',
      ]);
    });
  });

  it('should show docker commands in help', () => {
    cy.runMake('help').then((result) => {
      cy.verifyOutput(result.output, [
        'docker-up',
        'docker-down',
        'docker-restart',
        'docker-logs',
      ]);
    });
  });

  it('should show database commands in help', () => {
    cy.runMake('help').then((result) => {
      cy.verifyOutput(result.output, [
        'db-push',
        'db-seed',
        'db-reset',
        'db-migrate',
      ]);
    });
  });

  it('should show testing commands in help', () => {
    cy.runMake('help').then((result) => {
      cy.verifyOutput(result.output, [
        'test',
        'test-backend',
        'test-frontend',
        'test-e2e',
        'test-coverage',
      ]);
    });
  });

  it('should complete in reasonable time', () => {
    const startTime = Date.now();
    cy.runMake('help').then(() => {
      const duration = Date.now() - startTime;
      expect(duration).to.be.lessThan(5000); // Should complete in less than 5 seconds
    });
  });
});
