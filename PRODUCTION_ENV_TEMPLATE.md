# Production Environment Variables Template

Copy this content to a `.env` file on your production server and fill in the values.

```env
# Production Environment Variables
# Copy this content to .env on your production server

# ==================== Application Settings ====================
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000
BACKEND_PORT=5000
POSTGRES_PORT=5432

# ==================== Database Configuration ====================
POSTGRES_DB=estate_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD_MIN_16_CHARS
DATABASE_URL=postgresql://postgres:CHANGE_ME_STRONG_PASSWORD_MIN_16_CHARS@postgres:5432/estate_management?schema=public&sslmode=require

# ==================== Security Secrets (REQUIRED - Generate strong random values) ====================
# Generate secrets using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=CHANGE_ME_GENERATE_32_CHAR_MIN_SECRET
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=CHANGE_ME_GENERATE_32_CHAR_MIN_SECRET
COOKIE_SECRET=CHANGE_ME_GENERATE_32_CHAR_MIN_SECRET
ENCRYPTION_KEY=CHANGE_ME_GENERATE_32_CHAR_MIN_SECRET
ENCRYPTION_ALGORITHM=aes-256-gcm

# ==================== Security Settings ====================
REQUIRE_HTTPS=true
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=30
PASSWORD_MIN_LENGTH=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# ==================== Frontend Configuration ====================
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
VITE_API_URL=https://api.your-domain.com/api

# ==================== Email Configuration ====================
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=Estate Management <noreply@your-domain.com>

# ==================== File Upload Configuration ====================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# ==================== Cookie Configuration ====================
COOKIE_DOMAIN=.your-domain.com

# ==================== Docker Registry (for build/push script) ====================
DOCKER_REGISTRY=192.168.88.199:6800
DOCKER_REGISTRY_USER=
DOCKER_REGISTRY_PASSWORD=
```

## Generating Secure Secrets

To generate secure random secrets, use:

```bash
# Generate a 32-character hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using openssl
openssl rand -hex 32
```

## Important Notes

1. **All secrets marked with CHANGE_ME must be replaced** with strong random values
2. **POSTGRES_PASSWORD** must be at least 16 characters
3. **All other secrets** (JWT_SECRET, SESSION_SECRET, etc.) must be at least 32 characters
4. **FRONTEND_URL** and **ALLOWED_ORIGINS** should match your production domain
5. **VITE_API_URL** should point to your production API endpoint
6. **DATABASE_URL** should include SSL configuration (`sslmode=require`) in production







