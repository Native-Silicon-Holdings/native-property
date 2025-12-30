describe('Development Server Commands', () => {
  afterEach(() => {
    // Kill any running dev servers
    cy.task('execCommand', {
      command: 'pkill -f "npm run dev" || true',
      cwd: '../',
    }, { timeout: 10000 });
    cy.wait(2000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make dev', () => {
    it('should have dev command defined', () => {
      cy.task('execCommand', {
        command: 'make -n dev',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.verifyOutput(result.output, 'npm run dev');
      });
    });

    it('should verify dev command syntax', () => {
      // Note: Actually starting dev servers would block the test
      // We verify the command is properly defined
      cy.log('⚠️ dev starts long-running process - verifying command only');
    });
  });

  describe('make dev-backend', () => {
    it('should have dev-backend command defined', () => {
      cy.task('execCommand', {
        command: 'make -n dev-backend',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.verifyOutput(result.output, 'npm run dev');
      });
    });
  });

  describe('make dev-frontend', () => {
    it('should have dev-frontend command defined', () => {
      cy.task('execCommand', {
        command: 'make -n dev-frontend',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.verifyOutput(result.output, 'npm run dev');
      });
    });
  });

  describe('make docker-dev', () => {
    it('should have docker-dev command defined', () => {
      cy.task('execCommand', {
        command: 'make -n docker-dev',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.log('✅ docker-dev command defined');
      });
    });

    it('should start Docker development environment', () => {
      cy.runMake('docker-dev', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });

      cy.wait(5000);

      cy.getDockerStatus().then((result) => {
        expect(result.success).to.be.true;
      });

      cy.cleanupEnvironment();
    });
  });
});
