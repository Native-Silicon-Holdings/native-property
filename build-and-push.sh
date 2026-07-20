#!/bin/bash

# Build and Push Script for Native Estate (Supabase-native)
# Backend is RETIRED. Only the frontend SPA is built and pushed.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY="${DOCKER_REGISTRY:-192.168.88.199:6800}"
PROJECT_NAME="native-estate"
VERSION="${VERSION:-latest}"
FRONTEND_IMAGE="${REGISTRY}/${PROJECT_NAME}:${VERSION}"
LEGACY_IMAGE="${REGISTRY}/native-property-frontend:${VERSION}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Native Estate Frontend Build${NC}"
echo -e "${BLUE}(Supabase-native — no Express backend)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Registry:${NC} ${REGISTRY}"
echo -e "${YELLOW}Version:${NC} ${VERSION}"
echo ""

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

if [ -n "$DOCKER_REGISTRY_USER" ] && [ -n "$DOCKER_REGISTRY_PASSWORD" ]; then
    echo -e "${BLUE}Logging in to registry...${NC}"
    echo "$DOCKER_REGISTRY_PASSWORD" | docker login "$REGISTRY" -u "$DOCKER_REGISTRY_USER" --password-stdin || true
fi

echo -e "${BLUE}Building Frontend Image...${NC}"
cd frontend

docker build \
    --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
    --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}" \
    -t "${FRONTEND_IMAGE}" \
    -t "${LEGACY_IMAGE}" \
    -f Dockerfile .
echo -e "${GREEN}Frontend image built: ${FRONTEND_IMAGE}${NC}"
cd ..

echo -e "${BLUE}Pushing Frontend Image...${NC}"
docker push "${FRONTEND_IMAGE}"
docker push "${LEGACY_IMAGE}" || true
echo -e "${GREEN}Frontend image pushed successfully${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build and Push Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Image:${NC} ${FRONTEND_IMAGE}"
echo ""
