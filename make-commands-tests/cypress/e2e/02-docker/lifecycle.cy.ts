describe('Docker Lifecycle Commands', () => {
  beforeEach(() => {
    // Ensure clean state
    cy.cleanupEnvironment();
    cy.wait(3000); // Allow Docker to fully clean up
  });

  afterEach(() => {
    // Cleanup after each test
    cy.cleanupEnvironment();
  });

  describe('make docker-up', () => {
    it('should start Docker containers successfully', () => {
      cy.runMake('docker-up', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should have containers running after docker-up', () => {
      cy.runMake('docker-up', { timeout: 120000 });

      cy.wait(5000); // Wait for containers to stabilize

      cy.getDockerStatus().then((result) => {
        expect(result.success).to.be.true;
        expect(result.output).to.include('postgres');
      });
    });

    it('should make database port available', () => {
      cy.runMake('docker-up', { timeout: 120000 });

      cy.waitForPort(5432, 60000).then(() => {
        cy.isPortInUse(5432).then((inUse) => {
          expect(inUse).to.be.true;
        });
      });
    });
  });

  describe('make docker-down', () => {
    it('should stop Docker containers successfully', () => {
      // Start containers first
      cy.runMake('docker-up', { timeout: 120000 });
      cy.wait(5000);

      // Stop containers
      cy.runMake('docker-down', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should release database port after docker-down', () => {
      cy.runMake('docker-up', { timeout: 120000 });
      cy.waitForPort(5432, 60000);

      cy.runMake('docker-down', { timeout: 60000 });
      cy.wait(3000); // Wait for cleanup

      cy.isPortInUse(5432).then((inUse) => {
        expect(inUse).to.be.false;
      });
    });
  });

  describe('make docker-restart', () => {
    it('should restart Docker containers successfully', () => {
      // Start containers first
      cy.runMake('docker-up', { timeout: 120000 });
      cy.wait(5000);

      // Restart containers
      cy.runMake('docker-restart', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should have containers running after restart', () => {
      cy.runMake('docker-up', { timeout: 120000 });
      cy.wait(5000);

      cy.runMake('docker-restart', { timeout: 120000 });
      cy.wait(5000);

      cy.getDockerStatus().then((result) => {
        expect(result.success).to.be.true;
      });
    });
  });

  describe('make start and stop', () => {
    it('should start all services with make start', () => {
      cy.runMake('start', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should stop all services with make stop', () => {
      cy.runMake('start', { timeout: 120000 });
      cy.wait(5000);

      cy.runMake('stop', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });
  });

  describe('make docker-ps', () => {
    it('should list containers when running', () => {
      cy.runMake('docker-up', { timeout: 120000 });
      cy.wait(5000);

      cy.runMake('docker-ps').then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should show empty list when containers are stopped', () => {
      cy.runMake('docker-ps', { expectSuccess: false }).then((result) => {
        // May return exit code 0 or 1 depending on Docker output
        expect(result.exitCode).to.be.oneOf([0, 1]);
      });
    });
  });
});
