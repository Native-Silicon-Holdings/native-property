# Production Deployment Guide

This guide explains how to build and deploy the Estate Management Platform to production.

## Prerequisites

- Docker and Docker Compose installed on build machine
- Docker registry accessible at `192.168.88.199:6800`
- Production server with Docker and Docker Compose installed
- Access to production server

## Step 1: Build and Push Images

### Option A: Using the Build Script (Recommended)

```bash
# Make the script executable (if not already)
chmod +x build-and-push.sh

# Build and push with default settings
./build-and-push.sh

# Or with custom version
VERSION=v1.0.0 ./build-and-push.sh

# Or with custom registry
DOCKER_REGISTRY=192.168.88.199:6800 ./build-and-push.sh

# With registry authentication
DOCKER_REGISTRY=192.168.88.199:6800 \
DOCKER_REGISTRY_USER=your-username \
DOCKER_REGISTRY_PASSWORD=your-password \
./build-and-push.sh
```

### Option B: Manual Build and Push

```bash
# Set registry
REGISTRY=192.168.88.199:6800
VERSION=latest

# Build backend
cd backend
docker build -t ${REGISTRY}/estate-management-backend:${VERSION} -f Dockerfile .
docker push ${REGISTRY}/estate-management-backend:${VERSION}
cd ..

# Build frontend
cd frontend
docker build \
    --build-arg VITE_API_URL=https://api.your-domain.com/api \
    -t ${REGISTRY}/estate-management-frontend:${VERSION} \
    -f Dockerfile .
docker push ${REGISTRY}/estate-management-frontend:${VERSION}
cd ..
```

## Step 2: Prepare Production Server

### 1. Copy Files to Production Server

Copy these files to your production server:
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `PRODUCTION_ENV_TEMPLATE.md` (for reference)

### 2. Create Production .env File

On your production server:

```bash
# Create .env file from template
nano .env
```

Copy the content from `PRODUCTION_ENV_TEMPLATE.md` and fill in all values:

**Required changes:**
- Replace all `CHANGE_ME_*` placeholders with actual values
- Set `FRONTEND_URL` to your production domain
- Set `ALLOWED_ORIGINS` to your production domains
- Set `VITE_API_URL` to your production API URL
- Generate strong secrets (see below)

### 3. Generate Secure Secrets

```bash
# Generate secrets (run multiple times for different secrets)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using openssl
openssl rand -hex 32
```

Update these in your `.env`:
- `JWT_SECRET`
- `SESSION_SECRET`
- `COOKIE_SECRET`
- `ENCRYPTION_KEY`
- `POSTGRES_PASSWORD` (at least 16 characters)

## Step 3: Deploy on Production Server

### 1. Login to Docker Registry (if required)

```bash
docker login 192.168.88.199:6800
```

### 2. Pull Images

```bash
# Set version
export VERSION=latest
export DOCKER_REGISTRY=192.168.88.199:6800

# Pull images
docker pull ${DOCKER_REGISTRY}/estate-management-backend:${VERSION}
docker pull ${DOCKER_REGISTRY}/estate-management-frontend:${VERSION}
```

### 3. Start Services

```bash
# Start with production compose override
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or with version specified
VERSION=latest docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Run Database Migrations

```bash
# Migrations run automatically on backend startup, but you can also run manually:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 5. Seed Database (Optional - only for initial setup)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma db seed
```

## Step 4: Verify Deployment

### Check Service Status

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Check Logs

```bash
# All services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
```

### Health Checks

```bash
# Backend health
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000
```

## Updating Deployment

### Update to New Version

```bash
# Pull new images
VERSION=v1.0.1 docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Restart services
VERSION=v1.0.1 docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Troubleshooting

### Images Not Found

If you get "image not found" errors:
1. Verify registry is accessible: `curl http://192.168.88.199:6800/v2/`
2. Check if you're logged in: `docker login 192.168.88.199:6800`
3. Verify image names match what was pushed

### Database Connection Issues

1. Check `DATABASE_URL` in `.env` matches your setup
2. Verify PostgreSQL container is running: `docker-compose ps postgres`
3. Check database logs: `docker-compose logs postgres`

### CORS Errors

1. Verify `ALLOWED_ORIGINS` in `.env` includes your frontend domain
2. Check `FRONTEND_URL` matches your actual frontend URL
3. Restart backend after changing CORS settings

## Production Checklist

- [ ] All secrets generated and set in `.env`
- [ ] `FRONTEND_URL` and `ALLOWED_ORIGINS` configured
- [ ] `VITE_API_URL` points to production API
- [ ] Database password is strong (16+ characters)
- [ ] HTTPS enabled (`REQUIRE_HTTPS=true`)
- [ ] Database SSL configured (`sslmode=require`)
- [ ] Images built and pushed to registry
- [ ] Services running and healthy
- [ ] Database migrations applied
- [ ] Health checks passing







