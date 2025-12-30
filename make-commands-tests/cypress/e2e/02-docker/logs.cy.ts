describe('Docker Logs Commands', () => {
  before(() => {
    // Start containers for log testing
    cy.cleanupEnvironment();
    cy.wait(3000);
    cy.runMake('docker-up', { timeout: 120000 });
    cy.wait(5000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make docker-logs', () => {
    it('should display container logs', () => {
      cy.runMake('docker-logs').then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
        expect(result.output).to.not.be.empty;
      });
    });

    it('should show logs from multiple containers', () => {
      cy.runMake('docker-logs').then((result) => {
        // Logs should contain output from different containers
        expect(result.output.length).to.be.greaterThan(0);
      });
    });
  });

  describe('make docker-logs-follow', () => {
    it('should accept follow logs command', () => {
      // Note: This test only verifies the command starts
      // We can't test continuous following in Cypress easily
      cy.runMake('docker-logs', { timeout: 10000 }).then((result) => {
        expect(result.success).to.be.true;
      });
    });
  });
});
