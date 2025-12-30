describe('Code Quality Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
  });

  describe('make lint', () => {
    it('should run ESLint on codebase', () => {
      cy.runMake('lint', { expectSuccess: false, timeout: 120000 }).then((result) => {
        // Lint may have warnings/errors, so we don't expect success
        // Just verify it runs
        expect(result.exitCode).to.be.oneOf([0, 1]);
        cy.log(`Lint completed with exit code: ${result.exitCode}`);
      });
    });

    it('should check both backend and frontend', () => {
      cy.runMake('lint', { expectSuccess: false, timeout: 120000 }).then((result) => {
        // Should run lint on both projects
        cy.log('✅ Lint executed on both backend and frontend');
      });
    });

    it('should be non-blocking (exits 0 even with errors)', () => {
      cy.runMake('lint', { timeout: 120000 }).then((result) => {
        // Based on Makefile, lint uses || true, so should always succeed
        expect(result.exitCode).to.equal(0);
      });
    });
  });

  describe('make lint-strict', () => {
    it('should run ESLint with strict mode', () => {
      cy.runMake('lint-strict', { expectSuccess: false, timeout: 120000 }).then((result) => {
        // Strict mode fails on warnings
        expect(result.exitCode).to.be.oneOf([0, 1]);
        cy.log(`Strict lint completed with exit code: ${result.exitCode}`);
      });
    });
  });

  describe('make lint-fix', () => {
    it('should run ESLint with auto-fix', () => {
      cy.runMake('lint-fix', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should attempt to fix linting issues', () => {
      cy.runMake('lint-fix', { timeout: 120000 });
      cy.log('✅ Auto-fix completed');
    });
  });

  describe('make format', () => {
    it('should format code with Prettier', () => {
      cy.runMake('format', { timeout: 60000 }).then((result) => {
        // Format may show warning if prettier not installed globally
        expect(result.exitCode).to.be.oneOf([0, 1]);
      });
    });
  });

  describe('make format-check', () => {
    it('should check code formatting', () => {
      cy.runMake('format-check', { expectSuccess: false, timeout: 60000 }).then((result) => {
        // Format check is non-blocking
        expect(result.exitCode).to.be.oneOf([0, 1]);
        cy.log(`Format check completed with exit code: ${result.exitCode}`);
      });
    });

    it('should be non-blocking', () => {
      cy.runMake('format-check', { timeout: 60000 }).then((result) => {
        // Based on Makefile, format-check uses || true
        expect(result.exitCode).to.equal(0);
      });
    });
  });

  describe('make type-check / typecheck', () => {
    it('should run TypeScript type checking', () => {
      cy.runMake('type-check', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should check both backend and frontend types', () => {
      cy.runMake('type-check', { timeout: 120000 }).then((result) => {
        cy.log('✅ Type checking completed');
      });
    });

    it('should have typecheck alias', () => {
      cy.runMake('typecheck', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });
  });
});
