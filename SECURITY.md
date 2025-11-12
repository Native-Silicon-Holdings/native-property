# Security Measures - Estate Management Platform

## Overview

This document outlines the comprehensive security measures implemented across the Estate Management Platform, with special focus on the Facial Authentication feature.

**Last Updated**: 2024-01-15
**Security Level**: Production-Ready with MVP Enhancements

---

## Table of Contents

1. [Facial Authentication Security](#facial-authentication-security)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [File Upload Security](#file-upload-security)
5. [Session Management](#session-management)
6. [Audit Logging](#audit-logging)
7. [Database Security](#database-security)
8. [API Security](#api-security)
9. [Frontend Security](#frontend-security)
10. [Deployment Security](#deployment-security)

---

## Facial Authentication Security

### Threat Model

**Primary Threats:**
- Unauthorized access through spoofed facial data
- Replay attacks using previously captured videos
- Brute force attempts
- Denial of Service (DoS) attacks
- Data leakage through timing attacks

### Implemented Protections

#### 1. Rate Limiting

**Initialization Endpoint** (`/api/facial-auth/initialize`):
- **Limit**: 5 requests per 15 minutes per IP
- **Purpose**: Prevent brute force enumeration of users
- **Response**: HTTP 429 with retry-after information

**Video Upload Endpoint** (`/api/facial-auth/upload/:verificationId`):
- **Limit**: 10 uploads per hour per IP
- **Purpose**: Prevent abuse of storage and processing resources
- **Response**: HTTP 429 with retry-after information

**Login Endpoint** (`/api/facial-auth/login`):
- **Limit**: 10 attempts per 15 minutes per IP
- **Purpose**: Prevent brute force attacks on verification IDs
- **Behavior**: Skips counting successful requests
- **Response**: HTTP 429 with retry-after information

```typescript
// Rate limiter configuration
facialAuthRateLimiter: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
}
```

#### 2. Session Management

**Verification Sessions:**
- **Expiry**: 15 minutes from creation
- **Cleanup**: Automatic deletion of sessions older than 24 hours
- **Single Use**: Each verification can only have one video upload
- **Status Tracking**: PENDING → PROCESSING → VERIFIED/FAILED/EXPIRED

**Anti-DoS Measures:**
- **Limit**: Maximum 5 pending verifications per user per hour
- **Cleanup**: Automatic removal of expired/old verifications
- **Validation**: All verification IDs validated as UUIDs before processing

```typescript
// Check for too many pending verifications
const recentPendingCount = await prisma.facialVerification.count({
  where: {
    userId: user.id,
    status: { in: ['PENDING', 'PROCESSING'] },
    createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
  },
});

if (recentPendingCount >= 5) {
  throw new Error('Too many pending verifications');
}
```

#### 3. Video File Validation

**Multi-Layer Validation:**

1. **File Size Checks:**
   - Minimum: 1 KB (prevents empty file attacks)
   - Maximum: 50 MB (prevents resource exhaustion)

2. **MIME Type Validation:**
   - Allowed: `video/mp4`, `video/webm`, `video/ogg`
   - Method: Server-side validation, not client-reported

3. **File Extension Validation:**
   - Allowed: `.mp4`, `.webm`, `.ogg`
   - Sanitized to prevent directory traversal

4. **Magic Number Verification:**
   - MP4: Checks for 'fty' signature at bytes 4-6
   - WebM: Checks for EBML header (0x1A45DF)
   - OGG: Checks for 'OggS' header (0x4F676753)

5. **Filename Sanitization:**
   - Removes special characters
   - Prevents path traversal (`../`, null bytes)
   - Generates cryptographically secure random names

6. **File Integrity:**
   - SHA-256 hash calculated for each upload
   - Stored in metadata for verification
   - Can detect duplicate uploads (replay attacks)

```typescript
// Magic number validation example
const fileHeader = fileBuffer.slice(0, 4);
if (file.mimetype === 'video/mp4') {
  const mp4Magic = fileBuffer.slice(4, 7);
  isValidVideo = mp4Magic[0] === 0x66 && mp4Magic[1] === 0x74 && mp4Magic[2] === 0x79;
}
```

#### 4. Input Sanitization

**Email Validation:**
- Regex pattern: `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`
- Injection prevention: Blocks `\n`, `\r`, `\0`
- Length limit: 255 characters
- Auto-sanitization: Trimmed and lowercased

**Verification ID Validation:**
- UUID v4 format enforcement
- Regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- Prevents SQL injection and path traversal

```typescript
export const sanitizeVerificationId = (req, res, next) => {
  const { verificationId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(verificationId)) {
    return res.status(400).json({ error: 'Invalid verification ID' });
  }

  next();
};
```

#### 5. IP Tracking & Logging

**Tracked Information:**
- IP address for all facial auth operations
- User agent string
- Timestamp of all actions
- Verification success/failure outcomes

**Logged Events:**
- Verification initialization
- Video uploads (with file metadata)
- Login attempts (successful and failed)
- Account status changes (enabled/disabled facial auth)
- Suspicious activities (multiple failures, expired sessions)

**Privacy Considerations:**
- IP addresses hashed for long-term storage (GDPR compliance)
- Retention period: 90 days
- User can request deletion of logs

```typescript
await prisma.activityLog.create({
  data: {
    userId: user.id,
    action: 'FACIAL_VERIFICATION_INITIALIZED',
    module: 'FACIAL_AUTH',
    details: { verificationId: verification.id },
    ipAddress: req.ip || 'unknown',
  },
});
```

#### 6. Secure File Storage

**Storage Configuration:**
- Directory: `uploads/facial-verifications/`
- Permissions: `0o750` (owner: rwx, group: r-x, others: none)
- Filename format: `facial-[timestamp]-[random32hex].[ext]`
- Random generation: `crypto.randomBytes(16)` for uniqueness

**File Organization:**
```
uploads/facial-verifications/
├── facial-1704924000000-a3f2c1e8d9b4... .webm
├── facial-1704924120000-f8e2d1c9a4b7... .mp4
└── facial-1704924240000-d9c3b2a1e8f7....ogg
```

**Future Enhancements (Production):**
- Encryption at rest (AES-256)
- Cloud storage (S3, Azure Blob)
- Automatic cleanup after 30 days
- CDN integration for delivery

#### 7. Anti-Spoofing Measures (Planned for Production)

**Current MVP:**
- Basic video validation
- Simulated verification (90% success rate)

**Production Requirements:**
- **Liveness Detection**: Detect photo/video replay attacks
  - Blink detection
  - Head movement tracking
  - Texture analysis (3D vs 2D)
  - Challenge-response (user performs random actions)

- **Face Matching**:
  - AWS Rekognition / Azure Face API integration
  - Confidence threshold: >= 95%
  - Multiple angle comparison
  - Age verification

- **Device Fingerprinting**:
  - Track devices used for verification
  - Flag unusual device changes
  - Browser fingerprinting

---

## Rate Limiting

### Global API Rate Limiting

**Configuration:**
- Window: 15 minutes
- Limit: 100 requests per IP
- Headers: `RateLimit-*` standard headers
- Response: HTTP 429 with retry information

### Endpoint-Specific Limits

| Endpoint | Window | Limit | Purpose |
|----------|--------|-------|---------|
| `/api/facial-auth/initialize` | 15 min | 5 | Prevent enumeration |
| `/api/facial-auth/upload/*` | 1 hour | 10 | Prevent abuse |
| `/api/facial-auth/login` | 15 min | 10 | Prevent brute force |
| `/api/auth/login` | 15 min | 10 | Prevent brute force |
| `/api/auth/register` | 1 hour | 3 | Prevent spam |

### Bypass for Testing

```typescript
skip: (req) => process.env.NODE_ENV === 'test'
```

---

## Input Validation & Sanitization

### Backend Validation

**All Inputs:**
1. Type checking (TypeScript + runtime)
2. Length validation
3. Format validation (regex)
4. Sanitization (escape special characters)
5. Injection prevention

**Example: User Registration:**
```typescript
// Validate email
if (!validator.isEmail(email)) {
  throw new Error('Invalid email format');
}

// Validate password strength
if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
  throw new Error('Password must be 8+ characters with uppercase and number');
}

// Sanitize name fields
firstName = validator.escape(validator.trim(firstName));
```

### Frontend Validation

**Form Validation:**
- React Hook Form with Zod schemas
- Real-time validation feedback
- Client-side sanitization
- Prevents invalid submissions

---

## File Upload Security

### General File Upload Protection

1. **File Type Whitelisting**: Only allowed MIME types
2. **Size Limits**: Enforced at multiple layers (client, server, nginx)
3. **Virus Scanning**: Recommended for production (ClamAV integration)
4. **Content Verification**: Magic number checking
5. **Secure Storage**: Outside web root, restricted permissions
6. **Unique Naming**: Prevents overwrites and enumeration

### Document Upload Security

- Maximum size: 10MB
- Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- Filename sanitization
- Quarantine period before public access

---

## Session Management

### JWT Token Security

**Configuration:**
- Algorithm: HS256 (HMAC with SHA-256)
- Secret: 256-bit random key (environment variable)
- Expiry: 24 hours
- Refresh: Not implemented (stateless for MVP)

**Token Claims:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "HOMEOWNER",
  "iat": 1704924000,
  "exp": 1705010400
}
```

**Security Measures:**
- Tokens stored in httpOnly cookies (not localStorage)
- CSRF token validation
- Token rotation on sensitive operations
- Immediate invalidation on password change

---

## Audit Logging

### Logged Events

**Authentication:**
- Login (success/failure)
- Logout
- Password changes
- Facial verification attempts
- Account lockouts

**Data Access:**
- Document views
- Sensitive data exports
- User profile changes
- Permission modifications

**Security Events:**
- Failed authorization attempts
- Rate limit violations
- Suspicious activities
- Configuration changes

### Log Format

```json
{
  "id": "uuid",
  "userId": "uuid",
  "action": "FACIAL_VERIFICATION_INITIALIZED",
  "module": "FACIAL_AUTH",
  "timestamp": "2024-01-15T10:30:00Z",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "details": {
    "verificationId": "uuid",
    "result": "success"
  }
}
```

### Log Retention

- **Active Logs**: 90 days in database
- **Archive**: 1 year in cold storage
- **Compliance**: 7 years for financial records
- **User Requests**: Deletable on request (GDPR)

---

## Database Security

### Prisma ORM Security

**Protection Against:**
- SQL Injection: Parameterized queries only
- Mass Assignment: Explicit field selection
- N+1 Queries: Optimized includes

**Example Secure Query:**
```typescript
const user = await prisma.user.findUnique({
  where: { email: validatedEmail },
  select: {
    id: true,
    email: true,
    passwordHash: true,
    // Explicit field selection
  },
});
```

### Password Security

- **Hashing**: bcrypt with salt rounds = 10
- **Validation**: Minimum 8 characters, complexity requirements
- **Storage**: Never logged, never returned in API responses
- **Reset**: Secure token-based reset flow

### Sensitive Data

**Encryption at Rest:**
- Database: PostgreSQL with encryption enabled
- Backups: Encrypted with AES-256
- File Storage: Pending (production requirement)

**Encryption in Transit:**
- TLS 1.3 for all API communications
- HTTPS redirect enforced
- HSTS headers enabled

---

## API Security

### CORS Configuration

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Headers

**Security Headers:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Error Handling

**Safe Error Messages:**
- No stack traces in production
- Generic messages for authentication failures
- Detailed logs server-side only
- No information leakage

```typescript
// Bad - leaks information
if (!user) {
  return res.json({ error: 'User john@example.com does not exist' });
}

// Good - generic message
if (!user) {
  return res.json({ error: 'Invalid credentials' });
}
```

---

## Frontend Security

### XSS Prevention

**React Protection:**
- Automatic escaping of rendered content
- No `dangerouslySetInnerHTML` usage
- Content Security Policy headers

**Input Sanitization:**
- DOMPurify for rich text
- Validation before storage
- Output encoding

### CSRF Protection

**Token-Based:**
- CSRF token in meta tag
- Included in all state-changing requests
- Validated server-side

### Secure Communication

**API Calls:**
- HTTPS only in production
- Credentials included in requests
- Timeout enforcement (30 seconds)

---

## Deployment Security

### Environment Variables

**Required Secrets:**
```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=<256-bit-random-key>

# Facial Auth
FACIAL_VERIFICATION_EXPIRY=900000
MAX_VIDEO_SIZE=52428800

# Production Services
AWS_REKOGNITION_ACCESS_KEY=<key>
AWS_REKOGNITION_SECRET_KEY=<secret>
```

**Management:**
- Never committed to repository
- Stored in secure vault (AWS Secrets Manager, Azure Key Vault)
- Rotated quarterly
- Different values per environment

### Docker Security

**Image Security:**
- Non-root user
- Multi-stage builds
- Minimal base images (Alpine)
- Regular updates

```dockerfile
# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### Network Security

**Firewall Rules:**
- Only expose necessary ports
- Backend not directly accessible
- Database isolated in private subnet

**nginx Configuration:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

## Security Testing

### Implemented Tests

1. **Unit Tests**: Input validation, sanitization
2. **Integration Tests**: Authentication flows, rate limiting
3. **E2E Tests**: Complete user journeys
4. **Security Tests**: Injection attempts, file upload validation

### Security Test Cases

**Facial Authentication:**
- Invalid verification ID format
- Expired session handling
- Duplicate upload prevention
- File type validation bypass attempts
- Size limit enforcement
- Magic number verification
- Rate limit enforcement

---

## Incident Response

### Security Event Classification

**Severity Levels:**
1. **Critical**: Data breach, system compromise
2. **High**: Unauthorized access, DoS attack
3. **Medium**: Brute force attempts, suspicious activities
4. **Low**: Rate limit hits, failed validations

### Response Procedures

1. **Detection**: Automated monitoring + manual review
2. **Containment**: Isolate affected systems
3. **Investigation**: Review logs, identify root cause
4. **Remediation**: Patch vulnerabilities, restore services
5. **Communication**: Notify affected users (GDPR requirement)
6. **Post-Mortem**: Document lessons learned

---

## Compliance

### GDPR Compliance

- Right to access: User can request all their data
- Right to deletion: Data purge on request
- Right to portability: Export functionality
- Breach notification: Within 72 hours
- Data minimization: Only collect necessary data
- Purpose limitation: Clear consent for facial data

### Data Protection

**Facial Biometric Data:**
- Explicit consent required
- Purpose-specific usage
- Secure storage
- Limited retention
- Audit trail maintained

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] File upload restrictions enforced
- [ ] Security headers configured
- [ ] Error messages sanitized
- [ ] Logging implemented
- [ ] Backup procedures tested
- [ ] Disaster recovery plan documented

### Post-Deployment

- [ ] Security monitoring active
- [ ] Log analysis automated
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Penetration testing completed
- [ ] User security training provided

---

## Future Enhancements

### Short Term (3 months)

1. Integrate AWS Rekognition for real facial recognition
2. Implement liveness detection
3. Add two-factor authentication (TOTP)
4. Enable video encryption at rest
5. Automated security scanning in CI/CD

### Long Term (6-12 months)

1. SOC 2 Type II compliance
2. Bug bounty program
3. Advanced threat detection
4. Zero-trust architecture
5. Blockchain verification audit trail

---

## Support & Contact

**Security Issues:**
- Email: security@estatemanagement.com
- Response Time: Within 24 hours
- Encryption: PGP public key available

**Security Advisories:**
- Published on GitHub Security tab
- Email notifications to registered users
- RSS feed available

---

**Document Version**: 1.0
**Last Review**: 2024-01-15
**Next Review**: 2024-04-15
