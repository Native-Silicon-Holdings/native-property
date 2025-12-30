describe('Make Command: db-studio', () => {
  before(() => {
    cy.cleanupEnvironment();
    cy.wait(3000);
  });

  after(() => {
    cy.cleanupEnvironment();
  });

  it('should have db-studio command defined', () => {
    cy.task('execCommand', {
      command: 'make -n db-studio',
      cwd: '../',
    }, { timeout: 10000 }).then((result: any) => {
      expect(result.success).to.be.true;
      cy.verifyOutput(result.output, 'prisma studio');
    });
  });

  it('should reference correct port (5555)', () => {
    cy.runMake('help').then((result) => {
      cy.verifyOutput(result.output, '5555');
    });
  });
});
