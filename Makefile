# Makefile for Estate Management Platform

.PHONY: help install dev build test clean docker-build docker-up docker-down docker-logs

help:
	@echo "Estate Management Platform - Available Commands:"
	@echo ""
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start development servers"
	@echo "  make build         - Build both backend and frontend"
	@echo "  make test          - Run all tests"
	@echo "  make test-backend  - Run backend tests only"
	@echo "  make test-frontend - Run frontend tests only"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-logs   - View Docker logs"
	@echo "  make migrate       - Run database migrations"
	@echo "  make seed          - Seed database with test data"
	@echo ""

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Generating Prisma Client..."
	cd backend && npx prisma generate
	@echo "✓ Installation complete!"

dev:
	@echo "Starting development servers..."
	@echo "Backend will run on http://localhost:5000"
	@echo "Frontend will run on http://localhost:3000"
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

build:
	@echo "Building backend..."
	cd backend && npm run build
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "✓ Build complete!"

test:
	@echo "Running all tests..."
	@make test-backend
	@make test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend && npm test

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test

test-e2e:
	@echo "Running E2E tests with Cypress..."
	cd frontend && npm run test:e2e:headless

test-e2e-open:
	@echo "Opening Cypress Test Runner..."
	cd frontend && npm run cypress

test-coverage:
	@echo "Running tests with coverage..."
	cd backend && npm test -- --coverage
	cd frontend && npm run test:coverage

lint:
	@echo "Running linters..."
	cd backend && npx eslint . --ext .ts || true
	cd frontend && npm run lint

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf frontend/dist
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf backend/coverage
	rm -rf frontend/coverage
	@echo "✓ Clean complete!"

migrate:
	@echo "Running database migrations..."
	cd backend && npx prisma migrate dev

migrate-deploy:
	@echo "Deploying database migrations..."
	cd backend && npx prisma migrate deploy

seed:
	@echo "Seeding database..."
	cd backend && npx prisma db seed

prisma-studio:
	@echo "Opening Prisma Studio..."
	cd backend && npx prisma studio

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d
	@echo "✓ Containers started!"
	@echo "Backend: http://localhost:5000"
	@echo "Frontend: http://localhost:3000"
	@echo "Database: localhost:5432"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-clean:
	@echo "Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

# Development with Docker
docker-dev:
	@echo "Starting development environment with Docker..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production deployment
docker-prod:
	@echo "Starting production environment..."
	docker-compose up -d --build

# Database backup
backup:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres estate_management > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✓ Backup created!"

# Database restore
restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup file path: " backup_file; \
	docker-compose exec -T postgres psql -U postgres estate_management < $$backup_file
	@echo "✓ Database restored!"
