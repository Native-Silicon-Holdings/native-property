#!/bin/bash

# Build and Push Script for Estate Management Platform
# This script builds production Docker images and pushes them to the Docker registry

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-192.168.88.199:6800}"
PROJECT_NAME="estate-management"
VERSION="${VERSION:-latest}"

# Image names
BACKEND_IMAGE="${REGISTRY}/${PROJECT_NAME}-backend:${VERSION}"
FRONTEND_IMAGE="${REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Estate Management Platform${NC}"
echo -e "${BLUE}Build and Push to Registry${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Registry:${NC} ${REGISTRY}"
echo -e "${YELLOW}Version:${NC} ${VERSION}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Check if we can reach the registry
echo -e "${BLUE}Checking registry connectivity...${NC}"
if ! timeout 5 bash -c "cat < /dev/null > /dev/tcp/${REGISTRY%%:*}/${REGISTRY##*:}" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Cannot reach registry ${REGISTRY}${NC}"
    echo -e "${YELLOW}   Continuing anyway...${NC}"
fi
echo ""

# Login to registry if credentials provided
if [ -n "$DOCKER_REGISTRY_USER" ] && [ -n "$DOCKER_REGISTRY_PASSWORD" ]; then
    echo -e "${BLUE}Logging in to registry...${NC}"
    echo "$DOCKER_REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$DOCKER_REGISTRY_USER" --password-stdin || {
        echo -e "${YELLOW}⚠️  Warning: Login failed, continuing without authentication${NC}"
    }
    echo ""
fi

# Build Backend
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Building Backend Image${NC}"
echo -e "${BLUE}========================================${NC}"
cd backend
docker build -t "${BACKEND_IMAGE}" -f Dockerfile .
echo -e "${GREEN}✅ Backend image built: ${BACKEND_IMAGE}${NC}"
cd ..
echo ""

# Build Frontend
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Building Frontend Image${NC}"
echo -e "${BLUE}========================================${NC}"
cd frontend

# Get API URL from environment or use default
# Note: This should be set to your production API URL
API_URL="${VITE_API_URL:-http://localhost:5000/api}"
echo -e "${YELLOW}Using API URL: ${API_URL}${NC}"

docker build \
    --build-arg VITE_API_URL="${API_URL}" \
    -t "${FRONTEND_IMAGE}" \
    -f Dockerfile .
echo -e "${GREEN}✅ Frontend image built: ${FRONTEND_IMAGE}${NC}"
cd ..
echo ""

# Push Backend
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Pushing Backend Image${NC}"
echo -e "${BLUE}========================================${NC}"
docker push "${BACKEND_IMAGE}" || {
    echo -e "${RED}❌ Failed to push backend image${NC}"
    exit 1
}
echo -e "${GREEN}✅ Backend image pushed successfully${NC}"
echo ""

# Push Frontend
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Pushing Frontend Image${NC}"
echo -e "${BLUE}========================================${NC}"
docker push "${FRONTEND_IMAGE}" || {
    echo -e "${RED}❌ Failed to push frontend image${NC}"
    exit 1
}
echo -e "${GREEN}✅ Frontend image pushed successfully${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Build and Push Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Images pushed to registry:${NC}"
echo -e "  ${BACKEND_IMAGE}"
echo -e "  ${FRONTEND_IMAGE}"
echo ""
echo -e "${YELLOW}To pull these images on your production server:${NC}"
echo -e "  docker pull ${BACKEND_IMAGE}"
echo -e "  docker pull ${FRONTEND_IMAGE}"
echo ""
echo -e "${YELLOW}To use with docker-compose, update docker-compose.yml:${NC}"
echo -e "  backend:"
echo -e "    image: ${BACKEND_IMAGE}"
echo -e "  frontend:"
echo -e "    image: ${FRONTEND_IMAGE}"
echo ""

