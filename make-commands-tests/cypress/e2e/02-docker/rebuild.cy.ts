describe('Make Command: docker-rebuild', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  it('should rebuild and restart containers', () => {
    cy.runMake('docker-rebuild', { timeout: 240000 }).then((result) => {
      expect(result.success).to.be.true;
      expect(result.exitCode).to.equal(0);
    });
  });

  it('should have containers running after rebuild', () => {
    cy.runMake('docker-rebuild', { timeout: 240000 });
    cy.wait(5000);

    cy.getDockerStatus().then((result) => {
      expect(result.success).to.be.true;
      expect(result.output).to.include('postgres');
    });
  });

  it('should make services available after rebuild', () => {
    cy.runMake('docker-rebuild', { timeout: 240000 });

    cy.waitForPort(5432, 60000).then(() => {
      cy.isPortInUse(5432).then((inUse) => {
        expect(inUse).to.be.true;
      });
    });
  });
});

describe('Make Command: docker-clean', () => {
  it('should prompt for confirmation (interactive)', () => {
    // Note: docker-clean is interactive and requires confirmation
    // We cannot fully test this in automated mode
    cy.log('⚠️ docker-clean requires interactive confirmation - skipping automated test');
  });
});
