#!/bin/bash

# RetroChat Deployment Sync Script
# This script pushes backend and frontend to their separate deployment repos

set -e  # Exit on error

echo "🚀 RetroChat Deployment Sync"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    echo "Please run 'git init' first"
    exit 1
fi

# Check if remotes are configured
BACKEND_REMOTE=$(git remote get-url backend-deploy 2>/dev/null || echo "")
FRONTEND_REMOTE=$(git remote get-url frontend-deploy 2>/dev/null || echo "")

if [ -z "$BACKEND_REMOTE" ]; then
    echo -e "${RED}❌ Backend deployment remote not configured${NC}"
    echo "Add it with: git remote add backend-deploy <backend-repo-url>"
    exit 1
fi

if [ -z "$FRONTEND_REMOTE" ]; then
    echo -e "${RED}❌ Frontend deployment remote not configured${NC}"
    echo "Add it with: git remote add frontend-deploy <frontend-repo-url>"
    exit 1
fi

echo -e "${BLUE}Backend remote:${NC} $BACKEND_REMOTE"
echo -e "${BLUE}Frontend remote:${NC} $FRONTEND_REMOTE"
echo ""

# Sync backend
echo -e "${BLUE}📦 Syncing backend...${NC}"
BACKEND_COMMIT=$(git subtree split --prefix=backend main)
if git push backend-deploy $BACKEND_COMMIT:main; then
    echo -e "${GREEN}✅ Backend synced successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Normal push failed, trying force push...${NC}"
    if git push backend-deploy $BACKEND_COMMIT:main --force; then
        echo -e "${GREEN}✅ Backend force synced successfully${NC}"
    else
        echo -e "${RED}❌ Backend sync failed${NC}"
        exit 1
    fi
fi

echo ""

# Sync frontend
echo -e "${BLUE}📦 Syncing frontend...${NC}"
FRONTEND_COMMIT=$(git subtree split --prefix=frontend main)
if git push frontend-deploy $FRONTEND_COMMIT:main; then
    echo -e "${GREEN}✅ Frontend synced successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Normal push failed, trying force push...${NC}"
    if git push frontend-deploy $FRONTEND_COMMIT:main --force; then
        echo -e "${GREEN}✅ Frontend force synced successfully${NC}"
    else
        echo -e "${RED}❌ Frontend sync failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 All deployment repos synced!${NC}"
