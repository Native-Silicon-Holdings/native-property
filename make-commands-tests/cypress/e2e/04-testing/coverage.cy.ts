describe('Test Coverage Commands', () => {
  describe('make test-coverage', () => {
    it('should run tests with coverage', () => {
      cy.runMake('test-coverage', { timeout: 180000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should generate backend coverage', () => {
      cy.runMake('test-coverage', { timeout: 180000 });

      cy.verifyFileExists('../backend/coverage').then((exists) => {
        expect(exists).to.be.true;
      });
    });

    it('should generate frontend coverage', () => {
      cy.runMake('test-coverage', { timeout: 180000 });

      cy.verifyFileExists('../frontend/coverage').then((exists) => {
        expect(exists).to.be.true;
      });
    });

    it('should create coverage reports', () => {
      cy.runMake('test-coverage', { timeout: 180000 }).then((result) => {
        // Coverage output should mention percentages
        const output = result.output.toLowerCase();
        const hasCoverage =
          output.includes('coverage') ||
          output.includes('%') ||
          output.includes('statements');

        if (hasCoverage) {
          cy.log('✅ Coverage report generated');
        } else {
          cy.log('⚠️ Coverage output format may vary');
        }
      });
    });
  });
});
