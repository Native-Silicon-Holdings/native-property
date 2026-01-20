import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Load environment variables FIRST
dotenv.config();

// Import security configuration and validation
import securityConfig from './config/security.config';

// Validate security configuration on startup (CRITICAL)
// This will throw an error if configuration is insecure
try {
  console.log('🔒 Validating security configuration...');
  securityConfig.validate();
  console.log('✅ Security configuration validated successfully');
} catch (error) {
  console.error('❌ Security validation failed');
  process.exit(1); // Exit if security requirements are not met
}

// Import routes
import authRoutes from './routes/auth.routes';
import facialAuthRoutes from './routes/facial-auth.routes';
import documentRoutes from './routes/document.routes';
import announcementRoutes from './routes/announcement.routes';
import utilityRoutes from './routes/utility.routes';
import meetingRoutes from './routes/meeting.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import propertyRoutes from './routes/property.routes';
import userRoutes from './routes/user.routes';
import financialRoutes from './routes/financial.routes';
import directorRoutes from './routes/director.routes';
import electionRoutes from './routes/election.routes';
import votingRoutes from './routes/voting.routes';

// Import middleware
import { auditLogger } from './middleware/audit-logging.middleware';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// ==================== SECURITY MIDDLEWARE ====================

// Trust proxy (required for accurate IP detection behind load balancers)
app.set('trust proxy', 1);

// Helmet - Security headers
app.use(helmet(securityConfig.getSecurityHeaders()));

// Compression - Reduce response size
app.use(compression());

// CORS - Controlled cross-origin access
app.use(cors(securityConfig.getCorsConfig()));

// Cookie parser with signing
app.use(cookieParser(process.env.COOKIE_SECRET));

// Body parsers with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit logging - Log all requests
app.use(auditLogger());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== HEALTH & MONITORING ====================

// Health check endpoint (no authentication required)
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connectivity
    const prismaModule = await import('./services/prisma.service');
    await prismaModule.default.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      service: 'Estate Management API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'Estate Management API',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// Readiness check (for Kubernetes/container orchestration)
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    const prismaModule = await import('./services/prisma.service');
    await prismaModule.default.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, reason: 'Database not ready' });
  }
});

// Liveness check (for Kubernetes/container orchestration)
app.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

// ==================== API ROUTES ====================

// API v1 routes (with versioning for future-proofing)
const API_VERSION = '/api/v1';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/facial-auth`, facialAuthRoutes);
app.use(`${API_VERSION}/documents`, documentRoutes);
app.use(`${API_VERSION}/announcements`, announcementRoutes);
app.use(`${API_VERSION}/utilities`, utilityRoutes);
app.use(`${API_VERSION}/meetings`, meetingRoutes);
app.use(`${API_VERSION}/maintenance`, maintenanceRoutes);
app.use(`${API_VERSION}/properties`, propertyRoutes);
app.use(`${API_VERSION}/users`, userRoutes);
app.use(`${API_VERSION}/financial`, financialRoutes);
app.use(`${API_VERSION}/directors`, directorRoutes);
app.use(`${API_VERSION}/elections`, electionRoutes);
app.use(`${API_VERSION}/voting`, votingRoutes);

// Legacy routes (for backward compatibility)
// TODO: Remove after frontend migration to v1
app.use('/api/auth', authRoutes);
app.use('/api/facial-auth', facialAuthRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/directors', directorRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/voting', votingRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler (must be after all routes)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // Log error details
  console.error('❌ ERROR:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Determine status code
  const statusCode = (err as any).statusCode || (err as any).status || 500;

  // Send safe error response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? 'An internal server error occurred'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.name,
    }),
  });
});

// ==================== GRACEFUL SHUTDOWN ====================

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Received shutdown signal, closing server gracefully...');

  try {
    // Close database connections
    const prismaModule = await import('./services/prisma.service');
    await prismaModule.default.$disconnect();
    console.log('✅ Database connections closed');

    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // In production, you might want to exit or alert
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  // Exit on uncaught exception (let process manager restart)
  process.exit(1);
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Estate Management Platform API Server');
  console.log('='.repeat(60));
  console.log(`📍 Port:        ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 HTTPS:       ${process.env.REQUIRE_HTTPS === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🔗 Health:      http://localhost:${PORT}/health`);
  console.log(`📊 API v1:      http://localhost:${PORT}${API_VERSION}`);
  console.log(`🔐 Security:    Helmet, CORS, Rate Limiting, Audit Logging`);
  console.log('='.repeat(60) + '\n');
});

export default app;
