# Estate Management Platform

A comprehensive web-based estate management platform designed to solve governance, communication, and accountability issues in residential estates.

## Overview

This platform addresses common challenges in estate management:
- Scattered communication (WhatsApp/email chaos)
- Utility billing disputes and lack of accountability
- Inaccessible AGM records and resolutions
- Unclear governance and election procedures
- Poor meeting communication
- Questionable legal compliance

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

## Deployment

### Backend Deployment (Railway/Render)

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

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Deploy the `dist` folder** to your hosting platform

3. **Configure environment variables** with your production API URL

### Environment-specific Configuration

**Production Checklist:**
- [ ] Use strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Configure email service (SendGrid/AWS SES)
- [ ] Set up file storage (AWS S3/Cloudinary)
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure SSL certificates

## Development Workflow

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

## Testing

Run tests:
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
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

- **API Documentation**: Available at `/api/docs` (when Swagger is configured)
- **Database Schema**: See `backend/prisma/schema.prisma`
- **Issues**: Report bugs and request features via GitHub Issues

## License

MIT License - See LICENSE file for details

## Contributors

Built for estate management and community governance.

---

**Version**: 1.0.0 (MVP)
**Last Updated**: 2024
