/**
 * Security Configuration and Validation
 *
 * This module enforces enterprise-level security requirements
 * and validates critical security configurations on startup.
 */

import crypto from 'crypto';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  passwordMinLength: number;
  sessionSecret: string;
  cookieSecret: string;
  requireHttps: boolean;
  allowedOrigins: string[];
  rateLimitWindow: number; // minutes
  rateLimitMaxRequests: number;
  encryptionKey: string;
  encryptionAlgorithm: string;
}

/**
 * Validate required security environment variables
 * Throws error if critical security configurations are missing or weak
 */
export function validateSecurityConfig(): void {
  const errors: string[] = [];

  // JWT Secret validation
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required in production');
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters for security');
  } else if (jwtSecret.includes('change') || jwtSecret.includes('secret-key')) {
    errors.push('JWT_SECRET appears to be a default value - please use a strong random secret');
  }

  // Database password validation
  const dbPassword = process.env.POSTGRES_PASSWORD;
  if (!dbPassword) {
    errors.push('POSTGRES_PASSWORD is required');
  } else if (dbPassword.length < 16) {
    errors.push('POSTGRES_PASSWORD must be at least 16 characters');
  } else if (dbPassword.includes('password') || dbPassword === 'postgres') {
    errors.push('POSTGRES_PASSWORD appears to be a default value - please use a strong password');
  }

  // Session secret validation
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    errors.push('SESSION_SECRET is required in production');
  } else if (sessionSecret.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters');
  }

  // Cookie secret validation
  const cookieSecret = process.env.COOKIE_SECRET;
  if (!cookieSecret) {
    errors.push('COOKIE_SECRET is required for secure cookie signing');
  } else if (cookieSecret.length < 32) {
    errors.push('COOKIE_SECRET must be at least 32 characters');
  }

  // Encryption key validation (for field-level encryption)
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    errors.push('ENCRYPTION_KEY is required for data encryption');
  } else if (encryptionKey.length < 32) {
    errors.push('ENCRYPTION_KEY must be at least 32 characters (256-bit)');
  }

  // Database URL should use SSL in production
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && process.env.NODE_ENV === 'production') {
    if (!databaseUrl.includes('sslmode=require') && !databaseUrl.includes('ssl=true')) {
      errors.push('DATABASE_URL should include SSL configuration in production (e.g., ?sslmode=require)');
    }
  }

  // Check for HTTPS in production
  if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_HTTPS !== 'true') {
    console.warn('⚠️  WARNING: REQUIRE_HTTPS is not enabled in production - HTTPS should be enforced');
  }

  // If any critical errors, throw and prevent startup
  if (errors.length > 0) {
    console.error('❌ CRITICAL SECURITY CONFIGURATION ERRORS:');
    errors.forEach((error, index) => {
      console.error(`   ${index + 1}. ${error}`);
    });
    console.error('\n💡 To fix these errors:');
    console.error('   1. Copy .env.example to .env');
    console.error('   2. Generate strong secrets using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error('   3. Update all placeholder values with production-ready secrets\n');
    throw new Error('Security validation failed - application will not start');
  }
}

/**
 * Get validated security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  // Validate configuration first
  validateSecurityConfig();

  return {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '30', 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    sessionSecret: process.env.SESSION_SECRET!,
    cookieSecret: process.env.COOKIE_SECRET!,
    requireHttps: process.env.REQUIRE_HTTPS === 'true',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    encryptionKey: process.env.ENCRYPTION_KEY!,
    encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  };
}

/**
 * Generate secure random string for secrets
 */
export function generateSecureSecret(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Validate password strength for enterprise requirements
 */
export function validateEnterprisePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = ['password', '12345', 'qwerty', 'admin', 'letmein', 'welcome'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns and is not secure');
  }

  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains too many repeated characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Security headers configuration for helmet
 */
export function getSecurityHeaders() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const,
    },
  } as const;
}

/**
 * CORS configuration
 */
export function getCorsConfig() {
  const config = getSecurityConfig();

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };
}

/**
 * Rate limiting configuration
 */
export function getRateLimitConfig() {
  const config = getSecurityConfig();

  return {
    windowMs: config.rateLimitWindow * 60 * 1000,
    max: config.rateLimitMaxRequests,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in test environment
    skip: (_req: any) => process.env.NODE_ENV === 'test',
  };
}

/**
 * Cookie configuration for secure authentication
 */
export function getCookieConfig() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    signed: true,
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

/**
 * Session configuration
 */
export function getSessionConfig() {
  const config = getSecurityConfig();

  return {
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'estate.sid', // Custom session name (security through obscurity)
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };
}

export default {
  validate: validateSecurityConfig,
  get: getSecurityConfig,
  generateSecret: generateSecureSecret,
  validateEnterprisePassword,
  getSecurityHeaders,
  getCorsConfig,
  getRateLimitConfig,
  getCookieConfig,
  getSessionConfig,
};
