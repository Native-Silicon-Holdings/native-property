---
sidebar_position: 1
---

# Developer Setup

Get your development environment ready to contribute to the Estate Management Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **PostgreSQL** >= 15.x ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **yarn** (comes with Node.js)

### Recommended
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **VS Code** ([Download](https://code.visualstudio.com/))
- **Postman** or **Insomnia** (for API testing)

### Verify Installation

```bash
node --version  # Should be >= 18
npm --version   # Should be >= 9
psql --version  # Should be >= 15
git --version
docker --version  # Optional but recommended
```

## Clone the Repository

```bash
git clone https://github.com/Coded-Shogun/native-property.git
cd native-property
```

## Project Structure

```
native-property/
├── backend/          # Node.js + Express API
├── frontend/         # React + TypeScript UI
├── docs/             # Docusaurus documentation
├── SECURITY.md       # Security documentation
├── README.md         # Project overview
└── docker-compose.yml
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/estate_management"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Facial Auth
FACIAL_VERIFICATION_EXPIRY=900000  # 15 minutes
MAX_VIDEO_SIZE=52428800             # 50MB
```

### 3. Setup Database

Start PostgreSQL and create database:

```bash
# Using PostgreSQL CLI
createdb estate_management

# Or using psql
psql -U postgres
CREATE DATABASE estate_management;
\q
```

### 4. Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 5. Start Backend

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Using Docker (Alternative)

If you prefer Docker:

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

## Verify Setup

### Test Backend

```bash
curl http://localhost:5000/health

# Should return:
# {"status":"OK","message":"Estate Management API is running"}
```

### Test Frontend

Navigate to `http://localhost:3000` - you should see the login page.

### Test Database Connection

```bash
cd backend
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555`

## Running Tests

### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
```

### Frontend Tests

```bash
cd frontend
npm test                    # Unit tests
npm run test:e2e           # E2E tests with Cypress
npm run test:e2e:open      # Cypress GUI
```

## IDE Setup

### VS Code Extensions (Recommended)

Install these extensions:
- ES Lint
- Prettier
- Prisma
- TypeScript and JavaScript Language Features
- Docker
- GitLens

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error

Verify PostgreSQL is running:

```bash
# Check status
pg_ctl status

# Start PostgreSQL
brew services start postgresql  # macOS
sudo service postgresql start   # Linux
```

### Prisma Generate Fails

```bash
# Clear Prisma cache
rm -rf node_modules/.prisma

# Reinstall
npm install

# Generate again
npx prisma generate
```

## Next Steps

- ✅ [Understand the Architecture](/docs/developer/architecture)
- ✅ [Learn the Tech Stack](/docs/developer/tech-stack)
- ✅ [Explore Project Structure](/docs/developer/project-structure)
- ✅ [Read Contributing Guidelines](/docs/developer/contributing/guidelines)

Ready to code! 🚀
