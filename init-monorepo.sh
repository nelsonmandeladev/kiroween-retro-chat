#!/bin/bash

# RetroChat Monorepo Initialization Script

set -e

echo "🎮 RetroChat Monorepo Setup"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if already initialized
if [ -d .git ]; then
    echo -e "${YELLOW}⚠️  Git repository already exists${NC}"
    read -p "Do you want to continue? This will not reinitialize. (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo -e "${BLUE}📦 Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git initialized${NC}"
    echo ""
fi

# Remove nested git repos
echo -e "${BLUE}🧹 Cleaning nested git repositories...${NC}"

if [ -d frontend/.git ]; then
    echo "  - Backing up frontend/.git to frontend/.git.backup"
    cp -r frontend/.git frontend/.git.backup
    rm -rf frontend/.git
    echo -e "${GREEN}  ✅ Removed frontend/.git${NC}"
fi

if [ -d backend/.git ]; then
    echo "  - Backing up backend/.git to backend/.git.backup"
    cp -r backend/.git backend/.git.backup
    rm -rf backend/.git
    echo -e "${GREEN}  ✅ Removed backend/.git${NC}"
fi

echo ""

# Add files
echo -e "${BLUE}📝 Adding files to git...${NC}"
git add .
echo -e "${GREEN}✅ Files staged${NC}"
echo ""

# Initial commit
echo -e "${BLUE}💾 Creating initial commit...${NC}"
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    git commit -m "Initial commit: RetroChat monorepo for Kiroween

- Backend: NestJS API with WebSocket support
- Frontend: Next.js with retro MSN Messenger UI
- Monorepo structure for easy submission and deployment"
    echo -e "${GREEN}✅ Initial commit created${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Monorepo initialized successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Create your main repository on GitHub"
echo "2. Add remote: ${YELLOW}git remote add origin <your-repo-url>${NC}"
echo "3. Push: ${YELLOW}git push -u origin main${NC}"
echo ""
echo "4. Create deployment repositories:"
echo "   - retrochat-backend (for Railway/Render)"
echo "   - retrochat-frontend (for Vercel)"
echo ""
echo "5. Configure deployment remotes:"
echo "   ${YELLOW}git remote add backend-deploy <backend-repo-url>${NC}"
echo "   ${YELLOW}git remote add frontend-deploy <frontend-repo-url>${NC}"
echo ""
echo "6. Sync deployments:"
echo "   ${YELLOW}./sync-deployments.sh${NC}"
echo ""
echo "📖 See DEPLOYMENT_SETUP.md for detailed instructions"
