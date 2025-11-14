# Deployment Setup Guide

This guide explains how to set up the monorepo for both Kiroween submission and separate deployments.

## Repository Structure

```
retro-chat/                    # Main monorepo (for Kiroween submission)
├── backend/                   # NestJS backend
├── frontend/                  # Next.js frontend
├── sync-deployments.sh        # Deployment sync script
└── README.md                  # Main documentation
```

## Initial Setup

### 1. Remove Nested Git Repos

If frontend or backend have their own `.git` folders, remove them:

```bash
# Backup if needed
cp -r frontend/.git frontend/.git.backup

# Remove nested git repos
rm -rf frontend/.git
rm -rf backend/.git
```

### 2. Initialize Monorepo

```bash
# Initialize git in root
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: RetroChat monorepo"

# Add your main repo remote
git remote add origin <your-monorepo-url>

# Push to main repo
git push -u origin main
```

### 3. Create Deployment Repositories

Create two separate repositories on GitHub:

- `retrochat-backend` - For Railway/Render deployment
- `retrochat-frontend` - For Vercel deployment

### 4. Configure Deployment Remotes

```bash
# Add backend deployment remote
git remote add backend-deploy git@github.com:yourorg/retrochat-backend.git

# Add frontend deployment remote
git remote add frontend-deploy git@github.com:yourorg/retrochat-frontend.git
```

### 5. Initial Push to Deployment Repos

```bash
# Push backend
git subtree push --prefix=backend backend-deploy main

# Push frontend
git subtree push --prefix=frontend frontend-deploy main
```

## Daily Workflow

### Making Changes

1. Work in your monorepo as usual
2. Commit changes to the monorepo
3. Push to main repo

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Syncing Deployment Repos

After pushing to main, sync the deployment repos:

```bash
./sync-deployments.sh
```

Or manually:

```bash
# Sync backend
git subtree push --prefix=backend backend-deploy main

# Sync frontend
git subtree push --prefix=frontend frontend-deploy main
```

## Platform-Specific Deployment

### Backend (Railway/Render)

Connect the `retrochat-backend` repo to your platform:

- Root directory: `/`
- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`

**Required Environment Variables:**

- `DATABASE_URL` - Neon PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 64`
- `BETTER_AUTH_URL` - Your backend URL (must be subdomain of `appacheur.com`, e.g., `https://api.appacheur.com`)
- `BETTER_AUTH_CLIENT_URL` - Your frontend URL (must be subdomain of `appacheur.com`, e.g., `https://app.appacheur.com`)
- `FRONTEND_URL` - Your frontend URL for WebSocket CORS (must match `BETTER_AUTH_CLIENT_URL`)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `OPENAI_API_KEY` - OpenAI API key
- `ALLOWED_ORIGINS` - Comma-separated additional origins (optional)
- `NODE_ENV` - Set to `production`
- `PORT` - Usually auto-set by platform (default: 3001)

**Important**: For production cross-subdomain authentication, both backend and frontend must be deployed on subdomains of `appacheur.com`. Using different domains (e.g., `vercel.app` and `railway.app`) will not work with the current configuration.

### Frontend (Vercel)

Connect the `retrochat-frontend` repo to Vercel:

- Framework: Next.js
- Root directory: `/`
- Build command: `npm run build`
- Output directory: `.next`

**Required Environment Variables:**

- `BETTER_AUTH_SECRET` - Same secret as backend
- `BETTER_AUTH_URL` - Your frontend URL (must be subdomain of `appacheur.com`, e.g., `https://app.appacheur.com`)
- `NEXT_PUBLIC_API_URL` - Your backend URL (must be subdomain of `appacheur.com`, e.g., `https://api.appacheur.com`)
- `NEXT_PUBLIC_WS_URL` - Your backend WebSocket URL (usually same as `NEXT_PUBLIC_API_URL`)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset

**Important**: Both URLs must be subdomains of `appacheur.com` for authentication to work in production.

## Troubleshooting

### Subtree Push Fails

If subtree push fails with "Updates were rejected":

```bash
# Force push (use with caution)
git push backend-deploy `git subtree split --prefix=backend main`:main --force
git push frontend-deploy `git subtree split --prefix=frontend main`:main --force
```

### Merge Conflicts

If you make changes directly in deployment repos:

```bash
# Pull changes back to monorepo
git subtree pull --prefix=backend backend-deploy main
git subtree pull --prefix=frontend frontend-deploy main
```

## For Kiroween Judges

To run the full project:

```bash
# Clone the monorepo
git clone <monorepo-url>
cd retro-chat

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run start:dev

# Setup frontend (in new terminal)
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

## Benefits of This Approach

✅ Single source of truth (monorepo)
✅ Easy for judges to clone and test
✅ Separate repos for platform-specific deployments
✅ No code duplication
✅ Automated sync process
✅ Independent deployment pipelines
