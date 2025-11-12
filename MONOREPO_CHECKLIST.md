# Monorepo Setup Checklist

Use this checklist to set up your RetroChat monorepo for Kiroween submission and deployment.

## ✅ Files Created

- [x] `.gitignore` - Root-level gitignore
- [x] `backend/.gitignore` - Backend-specific gitignore
- [x] `init-monorepo.sh` - Initialization script
- [x] `sync-deployments.sh` - Deployment sync script
- [x] `DEPLOYMENT_SETUP.md` - Detailed guide
- [x] `QUICK_START.md` - Quick reference

## 📋 Setup Steps

### [ ] 1. Initialize Monorepo

```bash
./init-monorepo.sh
```

This will:

- Remove nested `.git` folders from frontend/backend
- Initialize root git repository
- Create initial commit
- Show next steps

### [ ] 2. Create GitHub Repositories

Create three repositories on GitHub:

- [ ] Main monorepo: `retro-chat` (for Kiroween submission)
- [ ] Backend deployment: `retrochat-backend`
- [ ] Frontend deployment: `retrochat-frontend`

### [ ] 3. Push to Main Repository

```bash
git remote add origin git@github.com:yourorg/retro-chat.git
git push -u origin main
```

### [ ] 4. Configure Deployment Remotes

```bash
git remote add backend-deploy git@github.com:yourorg/retrochat-backend.git
git remote add frontend-deploy git@github.com:yourorg/retrochat-frontend.git
```

Verify remotes:

```bash
git remote -v
```

You should see:

- `origin` - Main monorepo
- `backend-deploy` - Backend deployment repo
- `frontend-deploy` - Frontend deployment repo

### [ ] 5. Initial Deployment Push

```bash
./sync-deployments.sh
```

Or manually:

```bash
git subtree push --prefix=backend backend-deploy main
git subtree push --prefix=frontend frontend-deploy main
```

### [ ] 6. Configure Deployment Platforms

#### Backend (Railway/Render)

- [ ] Connect `retrochat-backend` repository
- [ ] Set environment variables from `backend/.env.example`
- [ ] Configure build command: `npm install && npm run build`
- [ ] Configure start command: `npm run start:prod`
- [ ] Deploy

#### Frontend (Vercel)

- [ ] Connect `retrochat-frontend` repository
- [ ] Set environment variables from `frontend/.env.example`
- [ ] Framework preset: Next.js
- [ ] Build command: `npm run build`
- [ ] Deploy

### [ ] 7. Test Deployments

- [ ] Backend health check: `https://your-backend.com/health`
- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] WebSocket connection works
- [ ] Authentication works
- [ ] Real-time messaging works

### [ ] 8. Update Documentation

- [ ] Add deployment URLs to README.md
- [ ] Update HACKATHON_SUBMISSION.md with live demo link
- [ ] Test all documentation links

## 🔄 Daily Workflow

When making changes:

1. [ ] Work in monorepo
2. [ ] Commit changes: `git commit -m "Your changes"`
3. [ ] Push to main: `git push origin main`
4. [ ] Sync deployments: `./sync-deployments.sh`

## 🚨 Troubleshooting

### Subtree Push Fails

If you get "Updates were rejected":

```bash
# Force push (use with caution)
git push backend-deploy `git subtree split --prefix=backend main`:main --force
git push frontend-deploy `git subtree split --prefix=frontend main`:main --force
```

### Remote Not Found

Check remotes are configured:

```bash
git remote -v
```

Add missing remotes:

```bash
git remote add backend-deploy <url>
git remote add frontend-deploy <url>
```

### Nested Git Repos

If you see "fatal: not a valid object name":

```bash
rm -rf frontend/.git
rm -rf backend/.git
git add .
git commit -m "Remove nested git repos"
```

## 📚 Documentation

- [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) - Detailed deployment guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference
- [README.md](./README.md) - Main documentation
- [HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md) - Submission checklist

## ✨ Ready for Kiroween!

Once all checkboxes are complete, your project is ready for:

- ✅ Kiroween submission (judges can clone monorepo)
- ✅ Production deployment (separate repos for each platform)
- ✅ Easy maintenance (single source of truth)
