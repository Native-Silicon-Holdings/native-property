/**
 * Enterprise Audit Logging Middleware
 *
 * Provides comprehensive audit trails for compliance (SOC2, ISO27001, GDPR)
 * Logs all security-relevant events with context
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/prisma.service';
import { sanitizeForLogging } from '../utils/encryption.util';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  module: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Two-Factor Authentication
  TOTP_ENABLED = 'TOTP_ENABLED',
  TOTP_DISABLED = 'TOTP_DISABLED',
  TOTP_VERIFY_SUCCESS = 'TOTP_VERIFY_SUCCESS',
  TOTP_VERIFY_FAILURE = 'TOTP_VERIFY_FAILURE',
  BACKUP_CODE_USED = 'BACKUP_CODE_USED',

  // Facial Authentication
  FACIAL_AUTH_INIT = 'FACIAL_AUTH_INIT',
  FACIAL_AUTH_UPLOAD = 'FACIAL_AUTH_UPLOAD',
  FACIAL_AUTH_SUCCESS = 'FACIAL_AUTH_SUCCESS',
  FACIAL_AUTH_FAILURE = 'FACIAL_AUTH_FAILURE',
  FACIAL_AUTH_ENABLED = 'FACIAL_AUTH_ENABLED',
  FACIAL_AUTH_DISABLED = 'FACIAL_AUTH_DISABLED',

  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_REACTIVATED = 'USER_REACTIVATED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Data Access
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  BULK_OPERATION = 'BULK_OPERATION',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',

  // Document Management
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_DOWNLOAD = 'DOCUMENT_DOWNLOAD',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  DOCUMENT_SHARE = 'DOCUMENT_SHARE',

  // Financial
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  FINANCIAL_REPORT_ACCESSED = 'FINANCIAL_REPORT_ACCESSED',

  // System
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  SECURITY_POLICY_CHANGE = 'SECURITY_POLICY_CHANGE',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',

  // Security Events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
}

export enum AuditModule {
  AUTH = 'AUTH',
  USER = 'USER',
  DOCUMENT = 'DOCUMENT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MEETING = 'MEETING',
  MAINTENANCE = 'MAINTENANCE',
  PROPERTY = 'PROPERTY',
  UTILITY = 'UTILITY',
  FINANCIAL = 'FINANCIAL',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
}

/**
 * Create audit log entry in database
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Sanitize sensitive data before logging
    const sanitizedDetails = entry.details ? sanitizeForLogging(entry.details) : null;

    await prisma.activityLog.create({
      data: {
        userId: entry.userId || 'SYSTEM',
        action: entry.action,
        module: entry.module,
        details: {
          ...sanitizedDetails,
          resource: entry.resource,
          resourceId: entry.resourceId,
          method: entry.method,
          path: entry.path,
          statusCode: entry.statusCode,
          duration: entry.duration,
          userAgent: entry.userAgent,
          severity: entry.severity,
        },
        ipAddress: entry.ipAddress,
        timestamp: entry.timestamp,
      },
    });

    // For critical events, also log to console for immediate visibility
    if (entry.severity === 'critical' || entry.severity === 'error') {
      console.error('🚨 AUDIT LOG:', {
        action: entry.action,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        severity: entry.severity,
        timestamp: entry.timestamp,
      });
    }
  } catch (error) {
    // Critical: Audit logging failures should not break the application
    // but must be logged to console
    console.error('❌ AUDIT LOGGING FAILED:', error);
    console.error('Failed audit entry:', {
      action: entry.action,
      module: entry.module,
      userId: entry.userId,
    });
  }
}

/**
 * Middleware to log all API requests
 */
export function auditLogger() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capture original end function
    const originalEnd = res.end;

    // Override end function to log after response
    res.end = function (this: Response, ...args: any[]): any {
      // Restore original end
      res.end = originalEnd;

      // Calculate duration
      const duration = Date.now() - startTime;

      // Determine if request should be audited
      if (shouldAudit(req)) {
        const entry: AuditLogEntry = {
          userId: (req as any).user?.userId,
          action: `${req.method}_${req.path}`,
          module: getModuleFromPath(req.path),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
          timestamp: new Date(),
          severity: getSeverityFromStatus(res.statusCode),
        };

        // Log asynchronously (don't wait)
        createAuditLog(entry).catch(err => {
          console.error('Async audit logging error:', err);
        });
      }

      // Call original end
      return originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Middleware to log authentication events
 */
export function logAuthEvent(action: AuditAction, details?: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry: AuditLogEntry = {
        userId: (req as any).user?.userId || details?.userId,
        action,
        module: AuditModule.AUTH,
        details,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
        severity: action.includes('FAILURE') ? 'warning' : 'info',
      };

      await createAuditLog(entry);
    } catch (error) {
      console.error('Auth event logging error:', error);
    }

    next();
  };
}

/**
 * Log security event (synchronous - must complete)
 */
export async function logSecurityEvent(
  req: Request,
  action: AuditAction,
  details: any,
  severity: 'warning' | 'error' | 'critical' = 'warning'
): Promise<void> {
  const entry: AuditLogEntry = {
    userId: (req as any).user?.userId,
    action,
    module: AuditModule.SECURITY,
    details,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
    severity,
  };

  await createAuditLog(entry);

  // Critical security events should also trigger alerts
  if (severity === 'critical') {
    // TODO: Integrate with alerting system (email, Slack, PagerDuty)
    console.error('🚨 CRITICAL SECURITY EVENT:', {
      action,
      userId: entry.userId,
      ip: entry.ipAddress,
      details: sanitizeForLogging(details),
    });
  }
}

/**
 * Determine if request should be audited
 */
function shouldAudit(req: Request): boolean {
  // Skip health checks and static assets
  if (req.path === '/health' || req.path === '/metrics') return false;
  if (req.path.startsWith('/static/')) return false;

  // Audit all authenticated requests
  if ((req as any).user) return true;

  // Audit auth endpoints
  if (req.path.startsWith('/api/auth')) return true;

  // Audit security-sensitive endpoints
  const sensitivePaths = ['/api/users', '/api/documents', '/api/financial'];
  if (sensitivePaths.some(path => req.path.startsWith(path))) return true;

  return false;
}

/**
 * Extract module name from request path
 */
function getModuleFromPath(path: string): string {
  const matches = path.match(/^\/api\/([^\/]+)/);
  if (!matches) return 'UNKNOWN';

  const module = matches[1].toUpperCase();

  // Map to standard modules
  const moduleMap: { [key: string]: string } = {
    AUTH: AuditModule.AUTH,
    USERS: AuditModule.USER,
    DOCUMENTS: AuditModule.DOCUMENT,
    ANNOUNCEMENTS: AuditModule.ANNOUNCEMENT,
    MEETINGS: AuditModule.MEETING,
    MAINTENANCE: AuditModule.MAINTENANCE,
    PROPERTIES: AuditModule.PROPERTY,
    UTILITIES: AuditModule.UTILITY,
    FINANCIAL: AuditModule.FINANCIAL,
  };

  return moduleMap[module] || module;
}

/**
 * Get client IP address (supports proxies)
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Determine severity from HTTP status code
 */
function getSeverityFromStatus(statusCode: number): 'info' | 'warning' | 'error' | 'critical' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warning';
  return 'info';
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: string;
  module?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: string;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = { contains: filters.action };
  if (filters.module) where.module = filters.module;
  if (filters.ipAddress) where.ipAddress = filters.ipAddress;

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  if (filters.severity) {
    where.details = {
      path: ['severity'],
      equals: filters.severity,
    };
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1,
    pageSize: filters.limit || 100,
    totalPages: Math.ceil(total / (filters.limit || 100)),
  };
}

/**
 * Generate audit report for compliance
 */
export async function generateAuditReport(
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<any> {
  const logs = await queryAuditLogs({
    userId,
    startDate,
    endDate,
    limit: 10000,
  });

  // Aggregate statistics
  const stats = {
    totalEvents: logs.total,
    byAction: {} as { [key: string]: number },
    byModule: {} as { [key: string]: number },
    bySeverity: {} as { [key: string]: number },
    byUser: {} as { [key: string]: number },
    byIp: {} as { [key: string]: number },
  };

  logs.logs.forEach(log => {
    // Count by action
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

    // Count by module
    stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;

    // Count by severity
    const severity = (log.details as any)?.severity || 'info';
    stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

    // Count by user
    if (log.userId) {
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
    }

    // Count by IP
    if (log.ipAddress) {
      stats.byIp[log.ipAddress] = (stats.byIp[log.ipAddress] || 0) + 1;
    }
  });

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    statistics: stats,
    criticalEvents: logs.logs.filter(log => (log.details as any)?.severity === 'critical'),
    failedLogins: logs.logs.filter(log => log.action === AuditAction.LOGIN_FAILURE),
  };
}

export default {
  createAuditLog,
  auditLogger,
  logAuthEvent,
  logSecurityEvent,
  queryAuditLogs,
  generateAuditReport,
  AuditAction,
  AuditModule,
};
