# Estate Management Platform

A comprehensive estate management platform designed to solve governance, communication, and accountability issues in residential estates. Available as both a web application and native desktop app.

## Overview

This platform addresses common challenges in estate management:
- Scattered communication (WhatsApp/email chaos)
- Utility billing disputes and lack of accountability
- Inaccessible AGM records and resolutions
- Unclear governance and election procedures
- Poor meeting communication
- Questionable legal compliance

## 🖥️ Desktop Application

**NEW**: Native desktop application built with Tauri v2!

- **Cross-Platform**: Windows, macOS, and Linux
- **Lightweight**: 10-15MB installers (vs 100MB+ Electron apps)
- **Native Performance**: Built with Rust for maximum speed
- **System Integration**: Tray icons, notifications, file system access
- **Auto-Updates**: Seamless automatic updates
- **Secure**: Sandboxed execution with encrypted local storage

📖 **[Desktop App Documentation](./TAURI_DESKTOP.md)** | **[Developer Guide](./docs/docs/developer/tauri-desktop.md)**

## Technology Stack

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **File Storage**: Local storage with configurable cloud options
- **Email**: Nodemailer (configurable with SendGrid or SMTP)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Charts**: Recharts
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Project Structure

```
estate-management-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── models/          # (Prisma handles this)
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # App entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # App entry point
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Features (MVP - Phase 1)

### User Management & Authentication
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ **Facial Recognition Authentication** (Alternative login method)
- ✅ Role-based access control (Director, Manager, Homeowner, Tenant, Accountant)
- ✅ Password strength validation
- ✅ Activity logging

### Document Management
- ✅ Upload and categorize documents (AGM Minutes, Financial Reports, Rules & Regulations, etc.)
- ✅ Version control and history tracking
- ✅ Search and filter functionality
- ✅ Access control based on user roles

### Announcements System
- ✅ Create and publish announcements
- ✅ Category tags (Urgent, Maintenance, Financial, Social, General)
- ✅ Priority levels
- ✅ Read receipts and acknowledgments
- ✅ Pin important announcements

### Utility Management & Billing
- ✅ Record utility readings (Water, Electricity, Gas)
- ✅ Automatic consumption calculation
- ✅ Payment tracking
- ✅ Consumption analytics
- ✅ Bulk import capability

### Meeting Management
- ✅ Schedule meetings (AGM, Special, Board, Committee)
- ✅ Upload agendas and minutes
- ✅ RSVP functionality
- ✅ Attendance tracking
- ✅ Meeting history

### Maintenance Requests
- ✅ Submit maintenance requests with photos
- ✅ Categorization and priority levels
- ✅ Status tracking
- ✅ Assignment to staff/contractors
- ✅ Feedback and ratings

### Property Management
- ✅ Property listing and details
- ✅ Link users to properties
- ✅ Property type categorization

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/estate_management?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="24h"

# Server
PORT=5000
NODE_ENV="development"

# Email Configuration
EMAIL_SERVICE="smtp"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM="Estate Management <noreply@estatemanagement.com>"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

4. **Set up the database:**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

5. **Start the backend server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start the frontend development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

5. **Build for production:**
```bash
npm run build
```

## Database Schema

The platform uses the following main entities:

- **Users**: User accounts with roles and authentication
- **FacialVerifications**: Facial recognition verification records
- **Properties**: Estate properties/units
- **Documents**: Document management with versioning
- **Announcements**: Estate-wide announcements
- **Meetings**: Meeting scheduling and management
- **UtilityReadings**: Utility consumption tracking
- **Payments**: Payment records
- **MaintenanceRequests**: Maintenance issue tracking
- **ActivityLogs**: System activity audit trail

See `backend/prisma/schema.prisma` for complete schema definition.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Facial Authentication
- `POST /api/facial-auth/initialize` - Initialize facial verification session
- `POST /api/facial-auth/upload/:verificationId` - Upload verification video
- `GET /api/facial-auth/status/:verificationId` - Check verification status
- `POST /api/facial-auth/login` - Login with facial verification
- `POST /api/facial-auth/enable` - Enable facial auth (Authenticated)
- `POST /api/facial-auth/disable` - Disable facial auth (Authenticated)

### Documents
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `POST /api/documents` - Upload document (Director/Manager only)
- `PUT /api/documents/:id` - Update document metadata
- `POST /api/documents/:id/version` - Upload new version
- `DELETE /api/documents/:id` - Delete document (Director only)

### Announcements
- `GET /api/announcements` - List announcements
- `GET /api/announcements/:id` - Get announcement details
- `POST /api/announcements` - Create announcement (Director/Manager only)
- `PUT /api/announcements/:id` - Update announcement
- `POST /api/announcements/:id/acknowledge` - Acknowledge announcement
- `DELETE /api/announcements/:id` - Delete announcement (Director only)

### Utilities
- `GET /api/utilities/readings` - Get utility readings
- `GET /api/utilities/consumption/:propertyId` - Get consumption summary
- `POST /api/utilities/readings` - Add utility reading
- `POST /api/utilities/readings/bulk` - Bulk import readings
- `GET /api/utilities/payments` - Get payments
- `POST /api/utilities/payments` - Record payment

### Meetings
- `GET /api/meetings` - List meetings
- `GET /api/meetings/:id` - Get meeting details
- `POST /api/meetings` - Create meeting (Director/Manager only)
- `PUT /api/meetings/:id` - Update meeting
- `POST /api/meetings/:id/rsvp` - RSVP to meeting
- `POST /api/meetings/:id/attendance` - Record attendance
- `DELETE /api/meetings/:id` - Delete meeting (Director only)

### Maintenance
- `GET /api/maintenance` - List maintenance requests
- `GET /api/maintenance/:id` - Get request details
- `POST /api/maintenance` - Create request
- `PUT /api/maintenance/:id` - Update request (Director/Manager only)
- `POST /api/maintenance/:id/feedback` - Add feedback
- `DELETE /api/maintenance/:id` - Delete request (Director/Manager only)

### Properties
- `GET /api/properties` - List properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (Director/Manager only)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property (Director only)

### Users
- `GET /api/users` - List users (Director/Manager only)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user (Director/Manager only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Director only)
- `GET /api/users/:id/activity` - Get user activity logs

## User Roles & Permissions

### Director
- Full system access
- Can manage all modules
- Can create/delete users and properties
- Can conduct elections
- Can access all financial reports

### Manager
- Day-to-day operations management
- Can upload utility readings
- Can manage maintenance requests
- Can post announcements
- Can upload documents

### Accountant
- Access to financial records
- Can generate reports
- Can view utility billing
- Can view payment histories

### Homeowner/Tenant
- View own utility consumption and bills
- Access documents and announcements
- Submit maintenance requests
- Vote in elections
- View own payment history

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT tokens with 24-hour expiration
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- Role-based access control
- Activity logging for audit trails
- File type and size validation for uploads

## Docker Deployment

The application is fully containerized with Docker and Docker Compose.

### Quick Start with Docker

1. **Copy environment file:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

4. **View logs:**
```bash
docker-compose logs -f
```

5. **Stop all services:**
```bash
docker-compose down
```

### Using Makefile Commands

The project includes a Makefile for easier management:

```bash
# View all available commands
make help

# Start Docker containers
make docker-up

# View logs
make docker-logs

# Stop containers
make docker-down

# Build images
make docker-build

# Clean up Docker resources
make docker-clean
```

### Development with Docker

For development with hot-reload:

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or use Makefile
make docker-dev
```

### Production Deployment

#### Option 1: Traditional Deployment

**Backend Deployment (Railway/Render):**

1. **Prepare for deployment:**
```bash
cd backend
npm run build
```

2. **Set environment variables** on your hosting platform

3. **Run database migrations:**
```bash
npx prisma migrate deploy
```

4. **Start the application:**
```bash
npm start
```

**Frontend Deployment (Vercel/Netlify):**

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Deploy the `dist` folder** to your hosting platform

3. **Configure environment variables** with your production API URL

#### Option 2: Docker Deployment

**Deploy to Any Server with Docker:**

1. **On your server, clone the repository:**
```bash
git clone <repository-url>
cd estate-management-platform
```

2. **Configure environment:**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

3. **Start services:**
```bash
docker-compose up -d --build
```

4. **Run migrations:**
```bash
docker-compose exec backend npx prisma migrate deploy
```

#### Option 3: CI/CD with GitHub Actions

The project includes GitHub Actions workflows for automated deployment.

**Setup:**

1. **Add secrets to GitHub repository:**
   - `DOCKER_USERNAME` - Docker Hub username
   - `DOCKER_PASSWORD` - Docker Hub password
   - `DEPLOY_HOST` - Production server IP
   - `DEPLOY_USER` - SSH username
   - `DEPLOY_KEY` - SSH private key
   - `API_URL` - Production API URL

2. **Push to main branch** to trigger deployment

**Workflows:**
- `.github/workflows/ci.yml` - Runs tests on every push/PR
- `.github/workflows/deploy.yml` - Deploys to production on main branch

### Environment-specific Configuration

**Production Checklist:**
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure CORS for production domain
- [ ] Set up automated database backups
- [ ] Configure email service (SendGrid/AWS SES)
- [ ] Set up file storage (AWS S3/Cloudinary)
- [ ] Enable rate limiting on API endpoints
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure logging (Winston, ELK Stack)
- [ ] Use production database with proper backups
- [ ] Set up health check endpoints
- [ ] Configure firewall rules
- [ ] Enable Docker health checks

## Development Workflow

### Option 1: Local Development (without Docker)

1. **Start backend:**
```bash
cd backend && npm run dev
```

2. **Start frontend** (in another terminal):
```bash
cd frontend && npm run dev
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health
   - Prisma Studio: `npm run prisma:studio` (from backend directory)

### Option 2: Docker Development

```bash
# Start all services with Docker
make docker-dev

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Using Makefile for Development

```bash
# Install all dependencies
make install

# Start development servers (local)
make dev

# Run database migrations
make migrate

# Open Prisma Studio
make prisma-studio

# Run tests
make test

# Run linters
make lint
```

## Testing

### Backend Tests

The backend uses **Jest** and **Supertest** for testing.

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

**Test Structure:**
- `src/__tests__/utils/` - Unit tests for utility functions
- `src/__tests__/integration/` - Integration tests for API endpoints
- `src/__tests__/setup.ts` - Test configuration and mocks

**Example Tests:**
- Password utilities (hashing, validation)
- JWT token generation and verification
- Authentication endpoints (register, login, profile)
- Document management endpoints
- Authorization middleware

### Frontend Tests

The frontend uses **Vitest** and **React Testing Library** for testing.

```bash
cd frontend

# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

**Test Structure:**
- `src/__tests__/components/` - Component tests
- `src/__tests__/utils/` - Utility function tests
- `src/__tests__/setup.ts` - Test configuration

**Example Tests:**
- Login component rendering and validation
- API service configuration
- localStorage handling
- Form validation

### Running All Tests

Use the Makefile for convenience:

```bash
# Run all tests (backend + frontend)
make test

# Run tests with coverage
make test-coverage

# Run only backend tests
make test-backend

# Run only frontend tests
make test-frontend
```

## Future Enhancements (Phase 2+)

- [ ] Election and voting system
- [ ] Financial dashboard with charts
- [ ] Email notifications system
- [ ] Two-factor authentication
- [ ] Mobile app (React Native)
- [ ] Integration with accounting software
- [ ] Automated meter reading via IoT
- [ ] Online payment gateway integration
- [ ] Visitor management system
- [ ] Event booking for common areas

## Troubleshooting

### Database Connection Issues
```bash
# Verify PostgreSQL is running
psql -U postgres

# Check DATABASE_URL in .env file
# Ensure database exists
createdb estate_management
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Prisma Migration Issues
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## Support & Documentation

### 📚 Comprehensive Documentation (Docusaurus)

**Main Documentation Site**: [`docs/`](./docs/) - Built with Docusaurus

- **🏠 [Introduction](./docs/docs/intro.md)** - Platform overview and quick start
- **📖 [User Guide](./docs/docs/user-guide/getting-started.md)** - Complete end-user documentation
  - Getting started and first login
  - Facial authentication setup
  - Feature guides (Documents, Announcements, Utilities, etc.)
  - Role-specific guides
  - Troubleshooting
- **👨‍💻 [Developer Documentation](./docs/docs/developer/setup.md)** - Technical documentation
  - Development setup
  - Architecture and design
  - Backend/Frontend guides
  - Testing strategies
  - Contributing guidelines
- **📡 [API Reference](./docs/docs/api/overview.md)** - Complete API documentation
  - Authentication
  - All API endpoints
  - Request/response examples

**Run Documentation Locally**:
```bash
cd docs
npm install
npm start  # Opens at http://localhost:3000
```

### 📄 Quick Reference Guides

- **Testing**: [TESTING.md](./TESTING.md) - Comprehensive testing documentation
- **E2E Testing**: [E2E.md](./E2E.md) - Cypress E2E testing guide
- **Docker**: [DOCKER.md](./DOCKER.md) - Containerization and deployment
- **Facial Auth**: [FACIAL_AUTH.md](./FACIAL_AUTH.md) - Facial recognition setup
- **Security**: [SECURITY.md](./SECURITY.md) - Security measures and best practices
- **Database Schema**: `backend/prisma/schema.prisma` - Complete data model

### 🐛 Support

- **Issues**: [Report bugs](https://github.com/Coded-Shogun/native-property/issues)
- **Security**: security@estatemanagement.com
- **Contributing**: See [Contributing Guidelines](./docs/docs/developer/contributing/guidelines.md)

## License

MIT License - See LICENSE file for details

## Contributors

Built for estate management and community governance.

---

**Version**: 1.0.0 (MVP)
**Last Updated**: 2024
