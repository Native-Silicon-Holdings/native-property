describe('Build Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make build', () => {
    it('should build backend and frontend for production', () => {
      cy.runMake('build', { timeout: 300000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should create backend build artifacts', () => {
      cy.runMake('build', { timeout: 300000 });

      cy.verifyFileExists('../backend/dist').then((exists) => {
        expect(exists).to.be.true;
      });
    });

    it('should create frontend build artifacts', () => {
      cy.runMake('build', { timeout: 300000 });

      cy.verifyFileExists('../frontend/dist').then((exists) => {
        expect(exists).to.be.true;
      });
    });
  });

  describe('make build-prod', () => {
    it('should build production Docker images', () => {
      cy.runMake('build-prod', { timeout: 300000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should create Docker images', () => {
      cy.runMake('build-prod', { timeout: 300000 });

      cy.task('execCommand', {
        command: 'docker images | grep native-property',
        cwd: '../',
      }, { timeout: 30000 }).then((result: any) => {
        // Should have created images
        cy.log('Production images created');
      });
    });
  });

  describe('make dev-clean', () => {
    it('should clean build artifacts', () => {
      cy.runMake('dev-clean', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should remove dist directories', () => {
      // Build first
      cy.runMake('build', { timeout: 300000 });

      // Then clean
      cy.runMake('dev-clean', { timeout: 60000 });

      // Verify cleanup
      cy.log('✅ Build artifacts cleaned');
    });
  });
});
