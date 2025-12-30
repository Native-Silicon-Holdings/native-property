describe('Full Workflow Integration Tests', () => {
  describe('Complete Setup to Deploy Workflow', () => {
    before(() => {
      cy.cleanupEnvironment();
      cy.wait(3000);
    });

    after(() => {
      cy.cleanupEnvironment();
    });

    it('should complete full development workflow', () => {
      // 1. Help
      cy.runMake('help').then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 1: Help command successful');
      });

      // 2. Start Docker
      cy.runMake('docker-up', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 2: Docker containers started');
      });

      cy.wait(5000);

      // 3. Initialize Database
      cy.runMake('db-reset', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 3: Database initialized');
      });

      // 4. Run Tests
      cy.runMake('test', { timeout: 180000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 4: Tests passed');
      });

      // 5. Lint Code
      cy.runMake('lint-fix', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 5: Code linted');
      });

      // 6. Type Check
      cy.runMake('type-check', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 6: Type checking passed');
      });

      // 7. Build
      cy.runMake('build', { timeout: 300000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 7: Production build successful');
      });

      // 8. Verify build artifacts
      cy.verifyFileExists('../backend/dist').then((exists) => {
        expect(exists).to.be.true;
        cy.log('✅ Step 8: Build artifacts created');
      });

      // 9. Cleanup
      cy.runMake('docker-down', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Step 9: Environment cleaned up');
      });

      cy.log('🎉 Complete workflow successful!');
    });
  });

  describe('Database Workflow', () => {
    before(() => {
      cy.cleanupEnvironment();
      cy.wait(3000);
      cy.runMake('docker-up', { timeout: 120000 });
      cy.waitForDatabase(60000);
    });

    after(() => {
      cy.cleanupEnvironment();
    });

    it('should complete database workflow', () => {
      // 1. Generate Prisma Client
      cy.runMake('db-generate', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Prisma client generated');
      });

      // 2. Push Schema
      cy.runMake('db-push', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Schema pushed');
      });

      // 3. Seed Database
      cy.runMake('db-seed', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Database seeded');
      });

      // 4. Backup Database
      cy.runMake('db-backup', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Database backed up');
      });

      // 5. Reset Database
      cy.runMake('db-reset', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Database reset');
      });

      cy.log('🎉 Database workflow successful!');
    });
  });

  describe('Testing Workflow', () => {
    it('should complete testing workflow', () => {
      // 1. Unit Tests
      cy.runMake('test-unit', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Unit tests passed');
      });

      // 2. Integration Tests
      cy.runMake('test-integration', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Integration tests passed');
      });

      // 3. API Tests
      cy.runMake('test-api', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ API tests passed');
      });

      // 4. Coverage
      cy.runMake('test-coverage', { timeout: 180000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Coverage generated');
      });

      cy.log('🎉 Testing workflow successful!');
    });
  });

  describe('Code Quality Workflow', () => {
    it('should complete code quality checks', () => {
      // 1. Lint
      cy.runMake('lint', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Linting completed');
      });

      // 2. Format Check
      cy.runMake('format-check', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Format check completed');
      });

      // 3. Type Check
      cy.runMake('type-check', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Type checking passed');
      });

      // 4. Auto-fix
      cy.runMake('lint-fix', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Auto-fix completed');
      });

      cy.log('🎉 Code quality workflow successful!');
    });
  });

  describe('Docker Lifecycle Workflow', () => {
    beforeEach(() => {
      cy.cleanupEnvironment();
      cy.wait(3000);
    });

    afterEach(() => {
      cy.cleanupEnvironment();
    });

    it('should handle complete Docker lifecycle', () => {
      // 1. Start
      cy.runMake('start', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Services started');
      });

      cy.wait(5000);

      // 2. Check Status
      cy.runMake('status', { expectSuccess: false }).then(() => {
        cy.log('✅ Status checked');
      });

      // 3. View Logs
      cy.runMake('docker-logs', { timeout: 30000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Logs viewed');
      });

      // 4. Restart
      cy.runMake('restart', { timeout: 120000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Services restarted');
      });

      cy.wait(5000);

      // 5. Stop
      cy.runMake('stop', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        cy.log('✅ Services stopped');
      });

      cy.log('🎉 Docker lifecycle workflow successful!');
    });
  });
});
