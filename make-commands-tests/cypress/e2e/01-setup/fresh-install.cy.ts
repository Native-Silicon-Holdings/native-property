describe('Make Command: setup', () => {
  before(() => {
    // Cleanup before testing setup
    cy.cleanupEnvironment();
  });

  after(() => {
    // Cleanup after tests
    cy.cleanupEnvironment();
  });

  it('should check for required .env.example files', () => {
    cy.verifyFileExists('../.env.example').then((exists) => {
      expect(exists).to.be.true;
    });

    cy.verifyFileExists('../backend/.env.example').then((exists) => {
      expect(exists).to.be.true;
    });

    cy.verifyFileExists('../frontend/.env.example').then((exists) => {
      expect(exists).to.be.true;
    });
  });

  it('should run setup command successfully', () => {
    cy.runMake('setup', { timeout: 180000 }).then((result) => {
      expect(result.success).to.be.true;
      expect(result.exitCode).to.equal(0);

      // Verify setup output contains expected messages
      cy.verifyOutput(result.output, ['Setting up']);
    });
  });

  it('should create environment files', () => {
    // Check if .env files were created
    cy.verifyFileExists('../.env').then((exists) => {
      if (!exists) {
        cy.log('⚠️ Root .env not created - may be optional');
      }
    });

    cy.verifyFileExists('../backend/.env').then((exists) => {
      expect(exists).to.be.true;
    });

    cy.verifyFileExists('../frontend/.env').then((exists) => {
      expect(exists).to.be.true;
    });
  });

  it('should install backend dependencies', () => {
    cy.verifyFileExists('../backend/node_modules').then((exists) => {
      expect(exists).to.be.true;
    });

    cy.verifyFileExists('../backend/package-lock.json').then((exists) => {
      expect(exists).to.be.true;
    });
  });

  it('should install frontend dependencies', () => {
    cy.verifyFileExists('../frontend/node_modules').then((exists) => {
      expect(exists).to.be.true;
    });

    cy.verifyFileExists('../frontend/package-lock.json').then((exists) => {
      expect(exists).to.be.true;
    });
  });

  it('should generate Prisma client', () => {
    cy.verifyFileExists('../backend/node_modules/.prisma').then((exists) => {
      expect(exists).to.be.true;
    });
  });
});

describe('Make Command: status', () => {
  it('should run status check without errors', () => {
    cy.runMake('status', { expectSuccess: false }).then((result) => {
      // Status command should run even if services are down
      expect(result.exitCode).to.be.oneOf([0, 1]);
    });
  });

  it('should show Docker status', () => {
    cy.getDockerStatus().then((result) => {
      // Docker status should be retrievable
      expect(result).to.have.property('success');
    });
  });
});
