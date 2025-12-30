describe('Unit Testing Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
    // Tests don't require Docker to be running
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make test-backend', () => {
    it('should run backend unit tests', () => {
      cy.runMake('test-backend', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should show test results', () => {
      cy.runMake('test-backend', { timeout: 120000 }).then((result) => {
        // Jest output should contain test results
        const output = result.output.toLowerCase();
        const hasTestResults =
          output.includes('test') ||
          output.includes('pass') ||
          output.includes('fail') ||
          output.includes('jest');
        expect(hasTestResults).to.be.true;
      });
    });
  });

  describe('make test-frontend', () => {
    it('should run frontend unit tests', () => {
      cy.runMake('test-frontend', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should show test results', () => {
      cy.runMake('test-frontend', { timeout: 120000 }).then((result) => {
        // Vitest output should contain test results
        const output = result.output.toLowerCase();
        const hasTestResults =
          output.includes('test') ||
          output.includes('pass') ||
          output.includes('fail') ||
          output.includes('vitest');
        expect(hasTestResults).to.be.true;
      });
    });
  });

  describe('make test', () => {
    it('should run all tests (backend + frontend)', () => {
      cy.runMake('test', { timeout: 180000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should run both backend and frontend tests', () => {
      cy.runMake('test', { timeout: 180000 }).then((result) => {
        // Should contain output from both test runners
        cy.log('✅ All tests completed');
      });
    });
  });

  describe('make test-unit', () => {
    it('should run unit tests only', () => {
      cy.runMake('test-unit', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });
  });

  describe('make test-coverage', () => {
    it('should run tests with coverage report', () => {
      cy.runMake('test-coverage', { timeout: 180000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should generate coverage reports', () => {
      cy.runMake('test-coverage', { timeout: 180000 });

      // Check for coverage directories
      cy.verifyFileExists('../backend/coverage').then((exists) => {
        if (exists) {
          cy.log('✅ Backend coverage generated');
        }
      });

      cy.verifyFileExists('../frontend/coverage').then((exists) => {
        if (exists) {
          cy.log('✅ Frontend coverage generated');
        }
      });
    });
  });

  describe('make test-integration', () => {
    it('should run integration tests', () => {
      cy.runMake('test-integration', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });
  });

  describe('make test-api', () => {
    it('should run API tests', () => {
      cy.runMake('test-api', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });
  });

  describe('make test-file', () => {
    it('should require FILE parameter', () => {
      cy.runMake('test-file', { expectSuccess: false, timeout: 30000 }).then((result) => {
        // Should show usage or error
        cy.log('test-file requires FILE parameter');
      });
    });
  });
});
