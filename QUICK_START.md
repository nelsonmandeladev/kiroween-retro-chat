# RetroChat Quick Start

## For Kiroween Judges

Clone and run the full project:

```bash
git clone <monorepo-url>
cd retro-chat

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run db:migrate
npm run start:dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Visit: http://localhost:3000

## For Deployment Setup

### Step 1: Initialize Monorepo

```bash
./init-monorepo.sh
```

### Step 2: Push to Main Repo

```bash
git remote add origin <your-monorepo-url>
git push -u origin main
```

### Step 3: Create Deployment Repos

Create on GitHub:

- `retrochat-backend`
- `retrochat-frontend`

### Step 4: Configure Remotes

```bash
git remote add backend-deploy git@github.com:yourorg/retrochat-backend.git
git remote add frontend-deploy git@github.com:yourorg/retrochat-frontend.git
```

### Step 5: Sync Deployments

```bash
./sync-deployments.sh
```

## Daily Workflow

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Sync to deployment repos
./sync-deployments.sh
```

## Files Created

- `.gitignore` - Root gitignore for monorepo
- `backend/.gitignore` - Backend-specific ignores
- `init-monorepo.sh` - One-time setup script
- `sync-deployments.sh` - Deployment sync script
- `DEPLOYMENT_SETUP.md` - Detailed deployment guide
- `QUICK_START.md` - This file

## Need Help?

See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for detailed instructions and troubleshooting.
