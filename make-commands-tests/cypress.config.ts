import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    fixturesFolder: 'cypress/fixtures',

    // Extended timeouts for Docker operations
    defaultCommandTimeout: 10000,
    execTimeout: 120000, // 2 minutes for make commands
    taskTimeout: 120000,
    pageLoadTimeout: 60000,
    requestTimeout: 30000,
    responseTimeout: 30000,

    // Video and screenshot settings
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,

    // Retry settings
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Test isolation - we need to manage our own cleanup
    testIsolation: false,

    // Environment variables
    env: {
      BACKEND_URL: 'http://localhost:5000',
      API_URL: 'http://localhost:5000/api',
      DB_PORT: '5432',
      PROJECT_ROOT: '../',
    },

    setupNodeEvents(on, config) {
      // Task for running shell commands
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },

        // Execute make command and return result
        execCommand({ command, cwd = '../' }: { command: string; cwd?: string }) {
          const { execSync } = require('child_process');
          try {
            const output = execSync(command, {
              cwd,
              encoding: 'utf-8',
              stdio: 'pipe',
              env: { ...process.env, FORCE_COLOR: '0' },
            });
            return { success: true, output, exitCode: 0 };
          } catch (error: any) {
            return {
              success: false,
              output: error.stdout + error.stderr,
              exitCode: error.status || 1,
              error: error.message,
            };
          }
        },

        // Check if port is in use
        isPortInUse(port: number) {
          const net = require('net');
          return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(true));
            server.once('listening', () => {
              server.close();
              resolve(false);
            });
            server.listen(port);
          });
        },

        // Wait for port to be available
        waitForPort({ port, timeout = 30000 }: { port: number; timeout?: number }) {
          const net = require('net');
          const startTime = Date.now();

          return new Promise((resolve, reject) => {
            const tryConnect = () => {
              if (Date.now() - startTime > timeout) {
                reject(new Error(`Port ${port} not available after ${timeout}ms`));
                return;
              }

              const client = net.createConnection({ port, host: 'localhost' }, () => {
                client.end();
                resolve(true);
              });

              client.on('error', () => {
                setTimeout(tryConnect, 500);
              });
            };

            tryConnect();
          });
        },

        // Check if file exists
        fileExists(filePath: string) {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.resolve(filePath);
          return fs.existsSync(fullPath);
        },

        // Read file content
        readFile(filePath: string) {
          const fs = require('fs');
          const path = require('path');
          const fullPath = path.resolve(filePath);
          try {
            return fs.readFileSync(fullPath, 'utf-8');
          } catch (error: any) {
            return null;
          }
        },

        // Get Docker container status
        getDockerStatus() {
          const { execSync } = require('child_process');
          try {
            const output = execSync('docker ps --format "{{.Names}}\t{{.Status}}"', {
              encoding: 'utf-8',
              stdio: 'pipe',
            });
            return { success: true, output };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },
      });

      return config;
    },
  },
});
