# Quick Deployment Reference

## Build and Push to Registry

```bash
# Basic usage
./build-and-push.sh

# With version tag
VERSION=v1.0.0 ./build-and-push.sh

# With registry authentication
DOCKER_REGISTRY=192.168.88.199:6800 \
DOCKER_REGISTRY_USER=username \
DOCKER_REGISTRY_PASSWORD=password \
./build-and-push.sh
```

## Production Server Setup

### 1. Create .env file
```bash
# Copy template content to .env
nano .env
# Fill in all values from PRODUCTION_ENV_TEMPLATE.md
```

### 2. Deploy
```bash
# Pull and start
VERSION=latest docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

## Generate Secrets

```bash
# Generate 32-char hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Registry Images

- Backend: `192.168.88.199:6800/estate-management-backend:latest`
- Frontend: `192.168.88.199:6800/estate-management-frontend:latest`







