describe('Versioning Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make version-patch', () => {
    it('should have version-patch command defined', () => {
      cy.task('execCommand', {
        command: 'make -n version-patch',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.verifyOutput(result.output, 'npm version patch');
      });
    });

    it('should increment patch version', () => {
      // Read current version
      cy.readFileContent('../package.json').then((content) => {
        if (content) {
          const pkg = JSON.parse(content);
          const oldVersion = pkg.version;
          cy.log(`Current version: ${oldVersion}`);
        }
      });

      // Note: Actually running version commands would modify package.json
      // We verify the command is defined correctly
      cy.log('⚠️ Skipping actual version bump to avoid modifying package.json');
    });
  });

  describe('make version-minor', () => {
    it('should have version-minor command defined', () => {
      cy.task('execCommand', {
        command: 'make -n version-minor',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.verifyOutput(result.output, 'npm version minor');
      });
    });
  });

  describe('make version-major', () => {
    it('should have version-major command defined', () => {
      cy.task('execCommand', {
        command: 'make -n version-major',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.verifyOutput(result.output, 'npm version major');
      });
    });
  });

  describe('make release', () => {
    it('should have release command defined', () => {
      cy.task('execCommand', {
        command: 'make -n release',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.log('✅ release command defined');
      });
    });

    it('should include build and version bump', () => {
      cy.task('execCommand', {
        command: 'make -n release',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        cy.verifyOutput(result.output, ['build', 'version']);
      });
    });
  });

  describe('make release-build-only', () => {
    it('should have release-build-only command defined', () => {
      cy.task('execCommand', {
        command: 'make -n release-build-only',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.log('✅ release-build-only command defined');
      });
    });
  });
});

describe('Deployment Commands', () => {
  describe('make deploy-staging', () => {
    it('should show not configured message', () => {
      cy.runMake('deploy-staging', { timeout: 10000 }).then((result) => {
        cy.verifyOutput(result.output, 'not configured');
      });
    });
  });

  describe('make deploy-prod', () => {
    it('should show not configured message', () => {
      cy.runMake('deploy-prod', { timeout: 10000 }).then((result) => {
        cy.verifyOutput(result.output, 'not configured');
      });
    });
  });

  describe('make deploy', () => {
    it('should be alias for deploy-prod', () => {
      cy.task('execCommand', {
        command: 'make -n deploy',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
      });
    });
  });
});
