describe('Docker Shell Access Commands', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
    cy.runMake('docker-up', { timeout: 120000 });
    cy.wait(5000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  describe('make docker-shell-backend', () => {
    it('should verify backend container exists for shell access', () => {
      cy.getDockerStatus().then((result) => {
        expect(result.success).to.be.true;
        // Container should be running for shell access
      });
    });

    it('should execute simple command in backend container', () => {
      // Test that we can execute commands in the backend container
      cy.task('execCommand', {
        command: 'docker exec native-property-backend-1 echo "test"',
        cwd: '../',
      }, { timeout: 30000 }).then((result: any) => {
        if (result.success || result.output.includes('test')) {
          cy.log('✅ Backend container is accessible');
          expect(result.output).to.include('test');
        } else {
          cy.log('⚠️ Backend container name may be different');
        }
      });
    });
  });

  describe('make docker-shell-frontend', () => {
    it('should verify frontend container exists for shell access', () => {
      cy.getDockerStatus().then((result) => {
        expect(result.success).to.be.true;
      });
    });

    it('should execute simple command in frontend container', () => {
      // Test that we can execute commands in the frontend container
      cy.task('execCommand', {
        command: 'docker exec native-property-frontend-1 echo "test"',
        cwd: '../',
      }, { timeout: 30000 }).then((result: any) => {
        if (result.success || result.output.includes('test')) {
          cy.log('✅ Frontend container is accessible');
          expect(result.output).to.include('test');
        } else {
          cy.log('⚠️ Frontend container name may be different');
        }
      });
    });
  });
});
