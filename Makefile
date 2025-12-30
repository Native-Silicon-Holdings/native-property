# Makefile for Estate Management Platform

.PHONY: help setup start stop restart status
.PHONY: docker-up docker-down docker-restart docker-logs docker-logs-follow docker-clean docker-rebuild docker-ps docker-shell-backend docker-shell-frontend
.PHONY: test test-watch test-coverage test-unit test-integration test-api test-security test-backend test-frontend test-e2e test-e2e-open test-e2e-chrome test-e2e-firefox test-e2e-mobile test-accessibility test-components test-integration-workflows test-file test-makefile
.PHONY: db-push db-seed db-reset db-studio db-migrate db-generate db-backup db-restore db-init db-fix-permissions db-restore-list db-restore-latest db-restore-minio db-restore-file
.PHONY: dev dev-clean docker-dev lint lint-fix lint-strict format format-check type-check typecheck
.PHONY: build build-prod version-patch version-minor version-major release release-build-only deploy-staging deploy-prod deploy

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Estate Management Platform - Developer Toolbox$(NC)"
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  make setup     - First-time setup"
	@echo "  make start     - Start everything"
	@echo "  make stop      - Stop everything"
	@echo "  make status    - Check service status"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-25s$(NC) %s\n", $$1, $$2}'

# ============================================
# Quick Start Commands
# ============================================

setup: ## First-time setup (install dependencies, setup database)
	@echo "$(BLUE)Setting up Estate Management Platform...$(NC)"
	@echo "$(BLUE)Setting up environment files...$(NC)"
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo "$(GREEN)✓ Created .env from .env.example$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Warning: .env.example not found$(NC)"; \
		fi \
	else \
		echo "$(GREEN)✓ .env already exists$(NC)"; \
	fi
	@if [ ! -f backend/.env ]; then \
		if [ -f backend/.env.example ]; then \
			cp backend/.env.example backend/.env; \
			echo "$(GREEN)✓ Created backend/.env from backend/.env.example$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Warning: backend/.env.example not found$(NC)"; \
		fi \
	else \
		echo "$(GREEN)✓ backend/.env already exists$(NC)"; \
	fi
	@if [ ! -f frontend/.env ]; then \
		if [ -f frontend/.env.example ]; then \
			cp frontend/.env.example frontend/.env; \
			echo "$(GREEN)✓ Created frontend/.env from frontend/.env.example$(NC)"; \
		else \
			echo "$(YELLOW)⚠ Warning: frontend/.env.example not found$(NC)"; \
		fi \
	else \
		echo "$(GREEN)✓ frontend/.env already exists$(NC)"; \
	fi
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && npm install
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(BLUE)Generating Prisma Client...$(NC)"
	cd backend && npx prisma generate
	@echo "$(GREEN)Setup complete! Run 'make start' to begin.$(NC)"

start: ## Start everything (docker + dev server)
	@echo "$(BLUE)Starting Estate Management Platform...$(NC)"
	make docker-up
	@echo "$(GREEN)Waiting for services to be ready...$(NC)"
	sleep 5
	@echo "$(GREEN)Services started!$(NC)"
	@echo "$(BLUE)Backend: http://localhost:5000$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(NC)"
	@echo "$(BLUE)Database: localhost:5432$(NC)"

stop: ## Stop everything
	@echo "$(BLUE)Stopping Estate Management Platform...$(NC)"
	make docker-down
	@echo "$(GREEN)Stopped.$(NC)"

restart: ## Restart services
	@echo "$(BLUE)Restarting Estate Management Platform...$(NC)"
	make docker-restart

status: ## Check service status
	@echo "$(BLUE)Service Status:$(NC)"
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps 2>/dev/null || echo "$(YELLOW)Docker Compose not running$(NC)"
	@echo ""
	@echo "$(BLUE)Development servers:$(NC)"
	@pgrep -f "nodemon" > /dev/null && echo "$(GREEN)Backend (nodemon): Running$(NC)" || echo "$(YELLOW)Backend (nodemon): Not running$(NC)"
	@pgrep -f "vite" > /dev/null && echo "$(GREEN)Frontend (vite): Running$(NC)" || echo "$(YELLOW)Frontend (vite): Not running$(NC)"

# ============================================
# Container Commands
# ============================================

docker-up: ## Start Docker containers (dev mode with hot-reload)
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	@if docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d 2>&1 | grep -q "port is already allocated"; then \
		echo "$(YELLOW)⚠ Port conflict detected. Trying to resolve...$(NC)"; \
		docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null || true; \
		sleep 2; \
		echo "$(BLUE)Retrying with clean state...$(NC)"; \
		docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d || \
		(echo "$(RED)✗ Failed to start containers.$(NC)"; \
		 echo "$(YELLOW)If port 3000 is in use, try:$(NC)"; \
		 echo "  - Stop any process using port 3000: sudo lsof -ti:3000 | xargs sudo kill -9"; \
		 echo "  - Or use a different port: FRONTEND_PORT=3001 make docker-up"; \
		 echo "  - Or restart Docker: sudo systemctl restart docker"; \
		 exit 1); \
	else \
		echo "$(GREEN)✓ Containers started!$(NC)"; \
	fi

docker-down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "$(GREEN)✓ Containers stopped.$(NC)"

docker-restart: ## Restart Docker containers
	@echo "$(BLUE)Restarting Docker containers...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart
	@echo "$(GREEN)✓ Containers restarted.$(NC)"

docker-logs: ## View Docker logs
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs

docker-logs-follow: ## Follow Docker logs
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

docker-clean: ## Remove containers, networks, and volumes
	@echo "$(YELLOW)⚠ This will remove all containers, networks, and volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v; \
		echo "$(GREEN)✓ Cleaned up.$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled.$(NC)"; \
	fi

docker-rebuild: ## Rebuild and restart containers
	@echo "$(BLUE)Rebuilding containers...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
	@echo "$(GREEN)✓ Containers rebuilt and restarted.$(NC)"

docker-ps: ## List running containers
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

docker-shell-backend: ## Open shell in backend container
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh

docker-shell-frontend: ## Open shell in frontend container
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend sh

# ============================================
# Testing Commands
# ============================================

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@make test-backend
	@make test-frontend

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@echo "$(YELLOW)Backend tests (watch):$(NC)"
	cd backend && npm run test:watch &
	@echo "$(YELLOW)Frontend tests (watch):$(NC)"
	cd frontend && npm test -- --watch

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@echo "$(YELLOW)Backend coverage:$(NC)"
	cd backend && npm run test:coverage
	@echo "$(YELLOW)Frontend coverage:$(NC)"
	cd frontend && npm run test:coverage

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	cd backend && npm test -- --testPathPattern="__tests__/(lib|components|utils)" --testPathIgnorePatterns="__tests__/integration"
	cd frontend && npm test -- --run

test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(NC)"
	cd backend && npm test -- --testPathPattern="__tests__/integration"

test-api: ## Run API tests only
	@echo "$(BLUE)Running API tests...$(NC)"
	cd backend && npm test -- --testPathPattern="__tests__/integration"

test-security: ## Run security tests
	@echo "$(BLUE)Running security tests...$(NC)"
	@echo "$(YELLOW)Security tests not yet implemented$(NC)"

test-backend: ## Run backend tests only
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && npm test

test-frontend: ## Run frontend tests only
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd frontend && npm test -- --run

test-e2e: ## Run E2E tests (headless)
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@echo "$(YELLOW)Note: Ensure dev server is running (make dev or make docker-dev)$(NC)"
	cd frontend && npm run test:e2e:headless

test-e2e-open: ## Open Cypress Test Runner (interactive)
	@echo "$(BLUE)Opening Cypress Test Runner...$(NC)"
	@echo "$(YELLOW)Note: Ensure dev server is running (make dev or make docker-dev)$(NC)"
	cd frontend && npm run cypress

test-e2e-chrome: ## Run E2E tests in Chrome
	@echo "$(BLUE)Running E2E tests in Chrome...$(NC)"
	@echo "$(YELLOW)Note: Ensure dev server is running (make dev or make docker-dev)$(NC)"
	cd frontend && npm run test:e2e:chrome

test-e2e-firefox: ## Run E2E tests in Firefox
	@echo "$(BLUE)Running E2E tests in Firefox...$(NC)"
	@echo "$(YELLOW)Note: Ensure dev server is running (make dev or make docker-dev)$(NC)"
	cd frontend && npm run test:e2e:firefox

test-e2e-mobile: ## Run E2E tests with mobile viewport
	@echo "$(BLUE)Running E2E tests with mobile viewport...$(NC)"
	@echo "$(YELLOW)Note: Ensure dev server is running (make dev or make docker-dev)$(NC)"
	cd frontend && npm run test:e2e:mobile

test-accessibility: ## Run accessibility tests
	@echo "$(BLUE)Running accessibility tests...$(NC)"
	cd frontend && npm run test:accessibility

test-components: ## Run component tests
	@echo "$(BLUE)Running component tests...$(NC)"
	cd frontend && npm run test:components

test-integration-workflows: ## Run integration workflow tests
	@echo "$(BLUE)Running integration workflow tests...$(NC)"
	@echo "$(YELLOW)Integration workflow tests not yet implemented$(NC)"

test-file: ## Run specific test file (usage: make test-file FILE=path/to/test)
	@if [ -z "$(FILE)" ]; then \
		echo "$(YELLOW)Usage: make test-file FILE=path/to/test$(NC)"; \
		exit 1; \
	fi
	@if echo "$(FILE)" | grep -q "frontend"; then \
		cd frontend && npm test -- $(FILE); \
	else \
		cd backend && npm test -- $(FILE); \
	fi

test-makefile: ## Run Makefile commands validation tests
	@echo "$(BLUE)Running Makefile commands validation tests...$(NC)"
	@echo "$(YELLOW)This will validate all make commands are working correctly$(NC)"
	@if [ ! -d make-commands-tests/node_modules ]; then \
		echo "$(BLUE)Installing test dependencies...$(NC)"; \
		cd make-commands-tests && npm install; \
	fi
	cd make-commands-tests && npm test
	@echo "$(GREEN)✓ Makefile validation complete!$(NC)"

# ============================================
# Database Commands (Inside Docker Containers)
# ============================================

db-push: ## Push Prisma schema to database
	@echo "$(BLUE)Pushing Prisma schema to database...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma db push
	@echo "$(GREEN)✓ Schema pushed.$(NC)"

db-seed: ## Seed database
	@echo "$(BLUE)Seeding database...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma db seed
	@echo "$(GREEN)✓ Database seeded.$(NC)"

db-reset: ## Reset database (push + seed)
	@echo "$(BLUE)Resetting database...$(NC)"
	make db-push
	make db-seed
	@echo "$(GREEN)✓ Database reset complete.$(NC)"

db-studio: ## Open Prisma Studio
	@echo "$(BLUE)Opening Prisma Studio...$(NC)"
	@echo "$(YELLOW)Prisma Studio will be available at http://localhost:5555$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -d backend npx prisma studio --port 5555 --browser none

db-migrate: ## Create and apply Prisma migration (usage: make db-migrate NAME=migration_name)
	@if [ -z "$(NAME)" ]; then \
		echo "$(YELLOW)Usage: make db-migrate NAME=migration_name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Creating migration: $(NAME)...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma migrate dev --name $(NAME)
	@echo "$(GREEN)✓ Migration created and applied.$(NC)"

db-generate: ## Generate Prisma client
	@echo "$(BLUE)Generating Prisma client...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma generate
	@echo "$(GREEN)✓ Prisma client generated.$(NC)"

db-backup: ## Backup database to file
	@echo "$(BLUE)Creating database backup...$(NC)"
	@mkdir -p backups
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres pg_dump -U $$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres printenv POSTGRES_USER | tr -d '\r') $$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres printenv POSTGRES_DB | tr -d '\r') | gzip > backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "$(GREEN)✓ Backup created in backups/ directory.$(NC)"

db-restore: ## Restore database from backup (usage: make db-restore FILE=backups/backup.sql.gz)
	@if [ -z "$(FILE)" ]; then \
		echo "$(YELLOW)Usage: make db-restore FILE=backups/backup.sql.gz$(NC)"; \
		echo "$(BLUE)Available backups:$(NC)"; \
		ls -lh backups/*.sql.gz 2>/dev/null || echo "$(YELLOW)No backups found$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)⚠ This will overwrite the current database!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)Restoring from $(FILE)...$(NC)"; \
		gunzip -c $(FILE) | docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U $$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres printenv POSTGRES_USER | tr -d '\r') $$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres printenv POSTGRES_DB | tr -d '\r'); \
		echo "$(GREEN)✓ Database restored.$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled.$(NC)"; \
	fi

db-init: ## Initialize database (push + seed)
	@echo "$(BLUE)Initializing database...$(NC)"
	make db-push
	make db-seed
	@echo "$(GREEN)✓ Database initialized.$(NC)"

db-fix-permissions: ## Fix Prisma engine permissions (local only, requires sudo)
	@echo "$(YELLOW)Note: This command requires sudo access$(NC)"
	@echo "$(BLUE)Fixing Prisma engine permissions...$(NC)"
	sudo chown -R $$(whoami):$$(whoami) backend/node_modules/.prisma/ 2>/dev/null || \
	(echo "$(YELLOW)Please run manually: sudo chown -R $$(whoami):$$(whoami) backend/node_modules/.prisma/$(NC)" && exit 1)
	@echo "$(GREEN)Permissions fixed! Regenerating Prisma client...$(NC)"
	cd backend && npx prisma generate

# ============================================
# Development Commands
# ============================================

dev: ## Start development servers (without Docker)
	@echo "$(BLUE)Starting development servers...$(NC)"
	@echo "$(BLUE)Backend will run on http://localhost:5000$(NC)"
	@echo "$(BLUE)Frontend will run on http://localhost:3000$(NC)"
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

docker-dev: ## Start full dev environment with Docker hot-reload
	@echo "$(BLUE)Starting development environment with Docker...$(NC)"
	make docker-up
	@echo "$(GREEN)Development environment started with hot-reload!$(NC)"
	@echo "$(BLUE)Backend: http://localhost:5000$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(NC)"
	@echo "$(BLUE)Database: localhost:5432$(NC)"
	@echo "$(YELLOW)View logs with: make docker-logs-follow$(NC)"

dev-clean: ## Clean build artifacts and restart dev server
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf backend/dist
	rm -rf frontend/dist
	rm -rf frontend/.next
	@echo "$(GREEN)✓ Clean complete.$(NC)"

lint: ## Run ESLint (shows errors and warnings)
	@echo "$(BLUE)Running linters...$(NC)"
	@echo "$(YELLOW)Backend:$(NC)"
	cd backend && npx eslint . --ext .ts --max-warnings 999999 || true
	@echo "$(YELLOW)Frontend:$(NC)"
	cd frontend && npm run lint || true

lint-strict: ## Run ESLint with zero tolerance (fails on any warnings)
	@echo "$(BLUE)Running strict linting...$(NC)"
	cd backend && npx eslint . --ext .ts --max-warnings 0
	cd frontend && npm run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "$(BLUE)Running linters with auto-fix...$(NC)"
	cd backend && npx eslint . --ext .ts --fix
	cd frontend && npm run lint -- --fix

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	@if command -v prettier > /dev/null; then \
		prettier --write "backend/**/*.{ts,json}" "frontend/**/*.{ts,tsx,json}" || echo "$(YELLOW)Prettier not configured$(NC)"; \
	else \
		echo "$(YELLOW)Prettier not installed. Install with: npm install -g prettier$(NC)"; \
	fi

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	@if command -v prettier > /dev/null; then \
		prettier --check "backend/**/*.{ts,json}" "frontend/**/*.{ts,tsx,json}" || echo "$(YELLOW)Formatting issues found$(NC)"; \
	else \
		echo "$(YELLOW)Prettier not installed. Install with: npm install -g prettier$(NC)"; \
	fi

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type check...$(NC)"
	@echo "$(YELLOW)Backend:$(NC)"
	cd backend && npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "node_modules" || true
	@echo "$(YELLOW)Frontend:$(NC)"
	cd frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "node_modules" || true
	@echo "$(GREEN)✅ Type check complete$(NC)"

typecheck: type-check ## Alias for type-check

# ============================================
# Build & Deployment Commands
# ============================================

build: ## Build for production
	@echo "$(BLUE)Building for production...$(NC)"
	@echo "$(YELLOW)Backend:$(NC)"
	cd backend && npm run build
	@echo "$(YELLOW)Frontend:$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✓ Build complete!$(NC)"

build-prod: ## Build with production Docker environment
	@echo "$(BLUE)Building production Docker images...$(NC)"
	docker-compose -f docker-compose.yml build
	@echo "$(GREEN)✓ Production build complete!$(NC)"

version-patch: ## Bump patch version
	@echo "$(BLUE)Bumping patch version...$(NC)"
	cd backend && npm version patch --no-git-tag-version
	cd frontend && npm version patch --no-git-tag-version
	@echo "$(GREEN)✓ Version bumped.$(NC)"

version-minor: ## Bump minor version
	@echo "$(BLUE)Bumping minor version...$(NC)"
	cd backend && npm version minor --no-git-tag-version
	cd frontend && npm version minor --no-git-tag-version
	@echo "$(GREEN)✓ Version bumped.$(NC)"

version-major: ## Bump major version
	@echo "$(BLUE)Bumping major version...$(NC)"
	cd backend && npm version major --no-git-tag-version
	cd frontend && npm version major --no-git-tag-version
	@echo "$(GREEN)✓ Version bumped.$(NC)"

release: ## Full release (build + version bump)
	@echo "$(BLUE)Creating release...$(NC)"
	@echo "$(YELLOW)This will build and prepare for deployment$(NC)"
	make build
	@echo "$(GREEN)✓ Release ready!$(NC)"

release-build-only: ## Build and prepare for release only
	make build-prod

deploy-staging: ## Deploy to staging (placeholder)
	@echo "$(YELLOW)Staging deployment not configured$(NC)"
	@echo "$(BLUE)To configure, add deployment scripts to package.json$(NC)"

deploy-prod: ## Deploy to production (placeholder)
	@echo "$(YELLOW)Production deployment not configured$(NC)"
	@echo "$(BLUE)To configure, add deployment scripts to package.json$(NC)"

deploy: deploy-prod ## Alias for deploy-prod
