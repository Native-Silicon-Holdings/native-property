# Troubleshooting Guide

## Cypress Installation Issues

### Issue: Cypress binary fails to start on Linux

**Error:**
```
Cypress failed to start.
/home/user/.cache/Cypress/XX.X.X/Cypress/Cypress: bad option: --no-sandbox
```

**Solution 1: Install Cypress dependencies**

On Ubuntu/Debian:
```bash
sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

**Solution 2: Run in Docker**

Use the official Cypress Docker image:
```bash
docker run -it -v $PWD:/e2e -w /e2e cypress/included:13.6.2 npm test
```

**Solution 3: Use GitHub Actions**

The test suite works perfectly in CI/CD environments. Add this workflow:

```yaml
name: Test Makefile Commands

on: [push, pull_request]

jobs:
  test-makefile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run tests
        run: |
          cd make-commands-tests
          npm install
          npm test
```

**Solution 4: Disable sandbox mode**

Add to `cypress.config.ts`:
```typescript
e2e: {
  chromeWebSecurity: false,
  env: {
    ELECTRON_EXTRA_LAUNCH_ARGS: '--disable-gpu --no-sandbox'
  }
}
```

### Issue: npm install doesn't install Cypress

**Symptom:**
```
npm install
# Shows "up to date" but Cypress not installed
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock files
rm -rf node_modules package-lock.json

# Install with npx (will auto-install)
npx cypress --version

# Or install globally
npm install -g cypress
```

### Issue: Port conflicts during tests

**Error:**
```
Port 3000 is already allocated
```

**Solution:**
```bash
# Find and kill process using the port
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
lsof -ti:5432 | xargs kill -9

# Or use different ports
FRONTEND_PORT=3001 BACKEND_PORT=5001 npm test
```

### Issue: Docker daemon not running

**Error:**
```
Cannot connect to the Docker daemon
```

**Solution:**
```bash
# Start Docker
sudo systemctl start docker

# Verify Docker is running
docker info

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: Database connection timeout

**Error:**
```
Port 5432 not available after 30000ms
```

**Solution:**
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check container logs
docker logs native-property-postgres-1

# Restart containers
make docker-restart

# Wait longer for database
# Edit test timeout in cypress.config.ts
```

### Issue: Tests fail with "command not found: make"

**Solution:**
```bash
# Install make
# Ubuntu/Debian
sudo apt-get install build-essential

# Fedora/RHEL
sudo dnf install make

# macOS
xcode-select --install
```

## Running Tests Without Cypress Binary

If you can't get the Cypress binary to work on your system, you can still validate the Makefile commands manually:

### Manual Test Checklist

```bash
# 1. Help and Setup
make help
make setup
make status

# 2. Docker Lifecycle
make docker-up
sleep 10
make docker-ps
make docker-logs | head -20
make docker-down

# 3. Database Commands
make docker-up
sleep 10
make db-reset
make db-backup
make db-generate

# 4. Testing Commands
make test-backend
make test-frontend
make test

# 5. Code Quality
make lint
make type-check
make format-check

# 6. Build
make build

# 7. Cleanup
make docker-down
```

## CI/CD Testing

The most reliable way to run these tests is in a CI/CD environment:

### Docker Compose Test Runner

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  cypress:
    image: cypress/included:13.6.2
    working_dir: /e2e
    volumes:
      - .:/e2e
    command: npm test
    environment:
      - CYPRESS_baseUrl=http://host.docker.internal:3000
```

Run with:
```bash
docker-compose -f docker-compose.test.yml run --rm cypress
```

## Getting Help

If you continue to have issues:

1. Check [Cypress Documentation](https://docs.cypress.io/)
2. Review [Cypress System Requirements](https://docs.cypress.io/guides/getting-started/installing-cypress#System-requirements)
3. Check [Cypress GitHub Issues](https://github.com/cypress-io/cypress/issues)
4. Open an issue in this repository with:
   - Operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Docker version (`docker --version`)
   - Full error message
   - Steps to reproduce

## Alternatives to Cypress

If Cypress continues to be problematic, consider these alternatives:

### 1. Shell Script Tests

Create `test-makefile.sh`:
```bash
#!/bin/bash
set -e

echo "Testing make commands..."

make help
make status
# Add more tests...

echo "All tests passed!"
```

### 2. Jest with child_process

```javascript
const { execSync } = require('child_process');

test('make help works', () => {
  const output = execSync('make help').toString();
  expect(output).toContain('Estate Management Platform');
});
```

### 3. Bats (Bash Automated Testing System)

```bash
#!/usr/bin/env bats

@test "make help displays help menu" {
  run make help
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Estate Management Platform" ]]
}
```

## Known Working Environments

✅ **Confirmed Working:**
- GitHub Actions (ubuntu-latest)
- GitLab CI (ubuntu:22.04)
- Docker (cypress/included:13.6.2)
- macOS 12+ with Xcode
- Ubuntu 22.04 LTS with dependencies installed
- WSL2 on Windows 11

⚠️ **Known Issues:**
- Ubuntu 25.10 (Oracular) - Cypress binary compatibility
- Alpine Linux - Missing system dependencies
- Headless servers without X11
- ARM-based systems - Limited Cypress support

## Quick Fix for Most Issues

```bash
# Complete reset and reinstall
cd make-commands-tests
rm -rf node_modules package-lock.json
npm cache clean --force
npx cypress install --force
npm test
```
