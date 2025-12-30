/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Execute a make command in the project root
       * @param command - The make command to run (e.g., 'help', 'docker-up')
       * @param options - Options for command execution
       */
      runMake(
        command: string,
        options?: {
          expectSuccess?: boolean;
          timeout?: number;
          cwd?: string;
        }
      ): Chainable<{
        success: boolean;
        output: string;
        exitCode: number;
        error?: string;
      }>;

      /**
       * Check if a service is healthy by making HTTP request
       * @param url - The URL to check
       * @param timeout - Maximum time to wait (ms)
       */
      checkServiceHealth(url: string, timeout?: number): Chainable<boolean>;

      /**
       * Wait for Docker containers to be ready
       * @param timeout - Maximum time to wait (ms)
       */
      waitForDocker(timeout?: number): Chainable<void>;

      /**
       * Wait for a specific port to be available
       * @param port - The port number to check
       * @param timeout - Maximum time to wait (ms)
       */
      waitForPort(port: number, timeout?: number): Chainable<void>;

      /**
       * Check if a port is currently in use
       * @param port - The port number to check
       */
      isPortInUse(port: number): Chainable<boolean>;

      /**
       * Cleanup environment (stop containers, clean up files)
       */
      cleanupEnvironment(): Chainable<void>;

      /**
       * Verify file exists
       * @param filePath - Path to file (relative to project root)
       */
      verifyFileExists(filePath: string): Chainable<boolean>;

      /**
       * Read file content
       * @param filePath - Path to file (relative to project root)
       */
      readFileContent(filePath: string): Chainable<string | null>;

      /**
       * Get Docker container status
       */
      getDockerStatus(): Chainable<{ success: boolean; output?: string; error?: string }>;

      /**
       * Wait for database to be ready
       * @param timeout - Maximum time to wait (ms)
       */
      waitForDatabase(timeout?: number): Chainable<void>;

      /**
       * Verify command output contains expected text
       * @param output - Command output to check
       * @param expectedText - Text that should be present
       */
      verifyOutput(output: string, expectedText: string | string[]): Chainable<void>;
    }
  }
}

// Execute make command
Cypress.Commands.add(
  'runMake',
  (
    command: string,
    options: {
      expectSuccess?: boolean;
      timeout?: number;
      cwd?: string;
    } = {}
  ) => {
    const { expectSuccess = true, timeout = 120000, cwd = '../' } = options;

    cy.log(`🔨 Running: make ${command}`);

    return cy
      .task(
        'execCommand',
        {
          command: `make ${command}`,
          cwd,
        },
        { timeout }
      )
      .then((result: any) => {
        cy.log(`Exit Code: ${result.exitCode}`);

        if (result.output) {
          cy.log('Output:', result.output.substring(0, 500));
        }

        if (expectSuccess && !result.success) {
          cy.log('❌ Command failed:', result.error || result.output);
          throw new Error(`Make command '${command}' failed: ${result.error || 'Unknown error'}`);
        }

        return result;
      });
  }
);

// Check service health
Cypress.Commands.add('checkServiceHealth', (url: string, timeout = 30000) => {
  cy.log(`🏥 Checking health: ${url}`);

  const startTime = Date.now();
  const checkHealth = (): Cypress.Chainable<boolean> => {
    return cy
      .request({
        url,
        failOnStatusCode: false,
        timeout: 5000,
      })
      .then((response) => {
        if (response.status === 200 || response.status === 404) {
          cy.log(`✅ Service healthy at ${url}`);
          return true;
        }

        if (Date.now() - startTime > timeout) {
          cy.log(`❌ Service not healthy after ${timeout}ms`);
          return false;
        }

        cy.wait(1000);
        return checkHealth();
      })
      .catch(() => {
        if (Date.now() - startTime > timeout) {
          cy.log(`❌ Service not reachable after ${timeout}ms`);
          return false;
        }

        cy.wait(1000);
        return checkHealth();
      });
  };

  return checkHealth();
});

// Wait for Docker containers
Cypress.Commands.add('waitForDocker', (timeout = 60000) => {
  cy.log('🐳 Waiting for Docker containers...');

  return cy
    .task('getDockerStatus', null, { timeout })
    .then((result: any) => {
      if (result.success && result.output) {
        cy.log('Docker containers:', result.output);
      }
    });
});

// Wait for port
Cypress.Commands.add('waitForPort', (port: number, timeout = 30000) => {
  cy.log(`🔌 Waiting for port ${port}...`);

  return cy.task('waitForPort', { port, timeout }, { timeout: timeout + 5000 }).then(() => {
    cy.log(`✅ Port ${port} is available`);
  });
});

// Check if port is in use
Cypress.Commands.add('isPortInUse', (port: number) => {
  return cy.task('isPortInUse', port).then((inUse) => {
    cy.log(`Port ${port}: ${inUse ? '🔴 In Use' : '🟢 Available'}`);
    return inUse as boolean;
  });
});

// Cleanup environment
Cypress.Commands.add('cleanupEnvironment', () => {
  cy.log('🧹 Cleaning up environment...');

  return cy
    .runMake('docker-down', { expectSuccess: false, timeout: 60000 })
    .then(() => {
      cy.wait(2000); // Give Docker time to clean up
      cy.log('✅ Environment cleaned');
    });
});

// Verify file exists
Cypress.Commands.add('verifyFileExists', (filePath: string) => {
  return cy.task('fileExists', filePath).then((exists) => {
    cy.log(`File ${filePath}: ${exists ? '✅ Exists' : '❌ Not Found'}`);
    return exists as boolean;
  });
});

// Read file content
Cypress.Commands.add('readFileContent', (filePath: string) => {
  return cy.task('readFile', filePath).then((content) => {
    return content as string | null;
  });
});

// Get Docker status
Cypress.Commands.add('getDockerStatus', () => {
  return cy.task('getDockerStatus').then((result) => {
    return result as { success: boolean; output?: string; error?: string };
  });
});

// Wait for database
Cypress.Commands.add('waitForDatabase', (timeout = 30000) => {
  cy.log('🗄️ Waiting for database...');
  return cy.waitForPort(5432, timeout);
});

// Verify output
Cypress.Commands.add('verifyOutput', (output: string, expectedText: string | string[]) => {
  const expectations = Array.isArray(expectedText) ? expectedText : [expectedText];

  expectations.forEach((text) => {
    expect(output).to.include(text);
  });
});

export {};
