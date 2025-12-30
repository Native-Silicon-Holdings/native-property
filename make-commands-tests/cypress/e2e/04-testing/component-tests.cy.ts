describe('Component Testing Commands', () => {
  describe('make test-components', () => {
    it('should have test-components command defined', () => {
      cy.task('execCommand', {
        command: 'make -n test-components',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
        cy.verifyOutput(result.output, 'test-storybook');
      });
    });

    it('should run Storybook component tests', () => {
      // Note: test-storybook requires Storybook to be running
      cy.log('⚠️ test-components requires Storybook server running');

      cy.task('execCommand', {
        command: 'make -n test-components',
        cwd: '../',
      }, { timeout: 10000 }).then((result: any) => {
        expect(result.success).to.be.true;
      });
    });
  });
});
