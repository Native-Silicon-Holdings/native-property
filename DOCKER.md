# Docker Quick Reference Guide

This guide provides quick commands for deploying and managing the Estate Management Platform using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd estate-management-platform

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
POSTGRES_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
```

### 2. Start the Application

```bash
# Start all services
docker-compose up -d

# Or use Makefile
make docker-up
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Database**: localhost:5432

## Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# View running containers
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d estate_management

# Create database backup
docker-compose exec postgres pg_dump -U postgres estate_management > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres estate_management < backup.sql
```

### Application Management

```bash
# Rebuild and restart services
docker-compose up -d --build

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Execute command in backend container
docker-compose exec backend sh

# Execute command in frontend container
docker-compose exec frontend sh
```

### Maintenance

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove unused Docker resources
docker system prune -f

# Remove all images
docker system prune -a

# View disk usage
docker system df
```

## Development Mode

### Start Development Environment

```bash
# With Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or with Makefile
make docker-dev
```

### Development Features

- **Hot Reload**: Code changes automatically reflected
- **Volume Mounts**: Local files synced to containers
- **Debug Access**: Full access to logs and debugging

### Development Commands

```bash
# View development logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Restart development services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart

# Stop development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

## Production Deployment

### On Your Server

```bash
# 1. Clone repository
git clone <repository-url>
cd estate-management-platform

# 2. Configure production environment
cp .env.example .env
nano .env  # Set production values

# 3. Build and start
docker-compose up -d --build

# 4. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Verify services
docker-compose ps
docker-compose logs
```

### Production Checklist

- [ ] Set strong passwords for database and JWT
- [ ] Configure proper email credentials
- [ ] Set FRONTEND_URL to production domain
- [ ] Configure CORS for production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure monitoring and logging
- [ ] Test all services are running
- [ ] Verify health checks passing

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart <service-name>
```

### Database Connection Issues

```bash
# Check if Postgres is running
docker-compose ps postgres

# Check Postgres logs
docker-compose logs postgres

# Verify DATABASE_URL in backend
docker-compose exec backend env | grep DATABASE_URL

# Restart Postgres
docker-compose restart postgres
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # Database

# Kill process
kill -9 <PID>

# Or change port in .env
BACKEND_PORT=5001
FRONTEND_PORT=3001
POSTGRES_PORT=5433
```

### Out of Disk Space

```bash
# Clean up Docker resources
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Remove stopped containers
docker container prune
```

### Migration Errors

```bash
# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npx prisma migrate reset

# Apply migrations manually
docker-compose exec backend npx prisma migrate deploy
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase memory limit in docker-compose.yml
services:
  backend:
    mem_limit: 512m
  frontend:
    mem_limit: 256m
```

## Health Checks

### Manual Health Check

```bash
# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:3000

# Database health
docker-compose exec postgres pg_isready -U postgres
```

### Container Health Status

```bash
# View health status
docker-compose ps

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' estate-backend
docker inspect --format='{{.State.Health.Status}}' estate-frontend
docker inspect --format='{{.State.Health.Status}}' estate-postgres
```

## Backup & Restore

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T postgres pg_dump -U postgres estate_management > $BACKUP_DIR/db_$DATE.sql

# Uploads backup
docker cp estate-backend:/app/uploads $BACKUP_DIR/uploads_$DATE

echo "Backup completed: $DATE"
```

### Restore from Backup

```bash
# Restore database
docker-compose exec -T postgres psql -U postgres estate_management < backups/db_YYYYMMDD_HHMMSS.sql

# Restore uploads
docker cp backups/uploads_YYYYMMDD_HHMMSS estate-backend:/app/uploads
```

## Monitoring

### View Logs

```bash
# All services (follow mode)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific time range
docker-compose logs --since="2024-01-01T00:00:00"

# Filter by service
docker-compose logs -f backend | grep ERROR
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Container resource limits
docker-compose exec backend cat /sys/fs/cgroup/memory/memory.limit_in_bytes

# Disk usage
docker system df
```

## Updates & Upgrades

### Update Application

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild images
docker-compose build

# 3. Stop and remove old containers
docker-compose down

# 4. Start with new images
docker-compose up -d

# 5. Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### Update Docker Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with no cache
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

## Useful Makefile Commands

```bash
# View all commands
make help

# Docker operations
make docker-build      # Build images
make docker-up         # Start containers
make docker-down       # Stop containers
make docker-logs       # View logs
make docker-clean      # Clean resources

# Database operations
make migrate           # Run migrations
make backup           # Create backup
make restore          # Restore backup

# Development
make docker-dev       # Start dev environment
make install          # Install dependencies
make test             # Run tests
```

## Security Best Practices

1. **Never commit `.env` files**
2. **Use strong passwords** (minimum 16 characters)
3. **Rotate JWT secrets** regularly
4. **Keep Docker images updated**
5. **Use non-root users** in containers
6. **Limit container resources**
7. **Enable Docker security scanning**
8. **Use secrets management** for production
9. **Regular security audits**
10. **Monitor container logs** for suspicious activity

## Performance Optimization

### Production Optimizations

```yaml
# docker-compose.yml optimizations
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
    restart: unless-stopped

  postgres:
    command: postgres -c max_connections=200 -c shared_buffers=256MB
    shm_size: 256mb
```

### Caching

```bash
# Use build cache
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1

# Use layer caching
DOCKER_BUILDKIT=1 docker-compose build
```

## Support

For issues and questions:
- Check logs: `docker-compose logs`
- Review health checks: `docker-compose ps`
- Consult main README.md
- Check GitHub issues

---

**Quick Reference Card**

| Task | Command |
|------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose down` |
| Logs | `docker-compose logs -f` |
| Rebuild | `docker-compose up -d --build` |
| Shell | `docker-compose exec backend sh` |
| Migrate | `docker-compose exec backend npx prisma migrate deploy` |
| Backup | `make backup` |
| Clean | `docker system prune -f` |
