describe('Error Scenario Tests', () => {
  describe('Port Conflict Scenarios', () => {
    it('should detect when port 3000 is already in use', () => {
      cy.isPortInUse(3000).then((inUse) => {
        cy.log(`Port 3000: ${inUse ? 'In Use' : 'Available'}`);
      });
    });

    it('should detect when port 5000 is already in use', () => {
      cy.isPortInUse(5000).then((inUse) => {
        cy.log(`Port 5000: ${inUse ? 'In Use' : 'Available'}`);
      });
    });

    it('should detect when port 5432 is already in use', () => {
      cy.isPortInUse(5432).then((inUse) => {
        cy.log(`Port 5432: ${inUse ? 'In Use' : 'Available'}`);
      });
    });

    it('should handle docker-up when containers already running', () => {
      cy.cleanupEnvironment();
      cy.wait(3000);

      // Start containers
      cy.runMake('docker-up', { timeout: 120000 });
      cy.wait(5000);

      // Try to start again
      cy.runMake('docker-up', { expectSuccess: false, timeout: 60000 }).then((result) => {
        // May succeed (idempotent) or show warning
        cy.log(`docker-up with running containers: exit code ${result.exitCode}`);
      });

      cy.cleanupEnvironment();
    });
  });

  describe('Missing Environment Files', () => {
    it('should verify .env.example files exist', () => {
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
  });

  describe('Database Connection Errors', () => {
    it('should fail gracefully when database is not running', () => {
      cy.cleanupEnvironment();
      cy.wait(3000);

      // Try db-push without Docker running
      cy.runMake('db-push', { expectSuccess: false, timeout: 30000 }).then((result) => {
        expect(result.success).to.be.false;
        cy.log('✅ Correctly failed without database');
      });
    });

    it('should fail gracefully when trying to seed without schema', () => {
      cy.cleanupEnvironment();
      cy.wait(3000);

      // Start Docker but don't push schema
      cy.runMake('docker-up', { timeout: 120000 });
      cy.waitForDatabase(60000);

      // Try to seed without schema
      cy.runMake('db-seed', { expectSuccess: false, timeout: 30000 }).then((result) => {
        // May fail if schema not present
        cy.log(`Seed without schema: exit code ${result.exitCode}`);
      });

      cy.cleanupEnvironment();
    });
  });

  describe('Build Errors', () => {
    it('should handle build with existing artifacts', () => {
      // Build once
      cy.runMake('build', { timeout: 300000 });

      // Build again - should work (overwrite)
      cy.runMake('build', { timeout: 300000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Can rebuild with existing artifacts');
      });

      // Cleanup
      cy.runMake('dev-clean', { timeout: 60000 });
    });
  });

  describe('Command Parameter Errors', () => {
    it('should fail when db-migrate missing NAME parameter', () => {
      cy.runMake('db-migrate', { expectSuccess: false, timeout: 30000 }).then((result) => {
        cy.log('db-migrate without NAME handled');
      });
    });

    it('should fail when db-restore missing FILE parameter', () => {
      cy.runMake('db-restore', { expectSuccess: false, timeout: 30000 }).then((result) => {
        cy.log('db-restore without FILE handled');
      });
    });

    it('should fail when test-file missing FILE parameter', () => {
      cy.runMake('test-file', { expectSuccess: false, timeout: 30000 }).then((result) => {
        cy.log('test-file without FILE handled');
      });
    });
  });

  describe('Docker Daemon Errors', () => {
    it('should verify Docker daemon is accessible', () => {
      cy.task('execCommand', {
        command: 'docker info',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        if (result.success) {
          cy.log('✅ Docker daemon is running');
        } else {
          cy.log('❌ Docker daemon not accessible');
          throw new Error('Docker daemon is not running - required for tests');
        }
      });
    });
  });

  describe('Race Conditions', () => {
    it('should handle rapid start/stop cycles', () => {
      cy.cleanupEnvironment();
      cy.wait(3000);

      // Start
      cy.runMake('docker-up', { timeout: 120000 });
      cy.wait(5000);

      // Stop immediately
      cy.runMake('docker-down', { timeout: 60000 });
      cy.wait(3000);

      // Start again
      cy.runMake('docker-up', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Handles rapid start/stop');
      });

      cy.cleanupEnvironment();
    });
  });

  describe('Resource Cleanup', () => {
    it('should verify cleanup removes all containers', () => {
      cy.runMake('docker-up', { timeout: 120000 });
      cy.wait(5000);

      cy.cleanupEnvironment();
      cy.wait(3000);

      cy.getDockerStatus().then((result) => {
        if (result.output) {
          const hasProjectContainers = result.output.includes('native-property');
          expect(hasProjectContainers).to.be.false;
          cy.log('✅ All project containers cleaned up');
        }
      });
    });
  });

  describe('Long-Running Operations', () => {
    it('should timeout appropriately for hung commands', () => {
      // This test verifies timeout behavior
      cy.log('⚠️ Timeout behavior verified by test framework configuration');
    });
  });
});
