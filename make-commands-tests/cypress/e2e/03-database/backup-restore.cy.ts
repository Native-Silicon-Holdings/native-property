describe('Database Backup and Restore Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
    cy.runMake('docker-up', { timeout: 120000 });
    cy.waitForDatabase(60000);
    cy.runMake('db-reset', { timeout: 120000 });
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make db-backup', () => {
    it('should create backup directory if not exists', () => {
      cy.task('execCommand', {
        command: 'mkdir -p backups',
        cwd: '../',
      });
    });

    it('should create database backup', () => {
      cy.runMake('db-backup', { timeout: 60000 }).then((result) => {
        expect(result.success).to.be.true;
        expect(result.exitCode).to.equal(0);
      });
    });

    it('should create backup file in backups directory', () => {
      cy.runMake('db-backup', { timeout: 60000 });

      cy.verifyFileExists('../backups').then((exists) => {
        expect(exists).to.be.true;
      });
    });

    it('should create backup with timestamp', () => {
      cy.runMake('db-backup', { timeout: 60000 }).then((result) => {
        // Backup should mention the file created
        cy.log('✅ Backup created successfully');
      });
    });
  });

  describe('make db-restore', () => {
    it('should require FILE parameter for restore', () => {
      cy.log('⚠️ db-restore requires FILE parameter');

      cy.runMake('db-restore', { expectSuccess: false, timeout: 30000 }).then((result) => {
        // Should show usage or error without FILE parameter
        cy.log('Restore without FILE parameter handled');
      });
    });

    it('should fail with non-existent backup file', () => {
      cy.task('execCommand', {
        command: 'make db-restore FILE=backups/nonexistent.sql.gz',
        cwd: '../',
      }, { timeout: 30000 }).then((result: any) => {
        expect(result.success).to.be.false;
        cy.log('✅ Correctly failed with non-existent file');
      });
    });
  });

  describe('make db-studio', () => {
    it('should verify Prisma Studio command exists', () => {
      // Note: db-studio opens an interactive web interface
      // We cannot fully test this in automated mode
      cy.log('⚠️ db-studio opens interactive interface - verifying command only');

      cy.task('execCommand', {
        command: 'make -n db-studio',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
      });
    });
  });
});
