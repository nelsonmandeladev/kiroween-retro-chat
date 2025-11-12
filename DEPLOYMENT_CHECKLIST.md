# Production Deployment Checklist

## Backend (Railway)

### Environment Variables to Set:

```bash
NODE_ENV=production
BETTER_AUTH_SECRET=1j3HKqpkP6Xs6iehs/NHGOmlAjXxse4amj+xjtAauL0VpU3YuLP4/MF6OU+nkTDDHxJdP9XVBR7nZTXMyLmH/Q==
BETTER_AUTH_URL=https://kiiroween-retrochat-backend-production.up.railway.app
BETTER_AUTH_CLIENT_URL=https://kiiroween-retrochat-frontend.vercel.app
ALLOWED_ORIGINS=https://kiiroween-retrochat-frontend.vercel.app
DATABASE_URL=<your-neon-db-url>
UPSTASH_REDIS_REST_URL=<your-upstash-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
OPENAI_API_KEY=<your-openai-key>
PORT=3001
```

### Critical Settings:

- ✅ `NODE_ENV=production` - MUST be set for proper cookie configuration
- ✅ `BETTER_AUTH_URL` - Must match your Railway domain
- ✅ `BETTER_AUTH_CLIENT_URL` - Must match your Vercel domain
- ✅ `ALLOWED_ORIGINS` - Must include your Vercel domain

## Frontend (Vercel)

### Environment Variables to Set:

```bash
BETTER_AUTH_SECRET=1j3HKqpkP6Xs6iehs/NHGOmlAjXxse4amj+xjtAauL0VpU3YuLP4/MF6OU+nkTDDHxJdP9XVBR7nZTXMyLmH/Q==
BETTER_AUTH_URL=https://kiiroween-retrochat-frontend.vercel.app
NEXT_PUBLIC_API_URL=https://kiiroween-retrochat-backend-production.up.railway.app
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwpsoxipp
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your-upload-preset>
```

### Critical Settings:

- ✅ `NEXT_PUBLIC_API_URL` - Must point to your Railway backend
- ✅ `BETTER_AUTH_SECRET` - Must match backend secret exactly

## Troubleshooting Production Session Issues

### 1. Check Railway Logs

Look for:

- "User profile created" messages after signup
- Any auth-related errors
- CORS errors

### 2. Check Browser DevTools (on production site)

**Network Tab:**

- Look for `/api/auth/sign-in/email` request
- Check Response Headers for `Set-Cookie`
- Verify cookie has: `SameSite=None; Secure; HttpOnly`

**Application Tab > Cookies:**

- Check if `better_auth.session_token` cookie exists
- Verify Domain is set correctly
- Verify Secure flag is checked
- Verify SameSite is "None"

### 3. Common Issues

**Issue: Cookie not being set**

- ✅ Verify `NODE_ENV=production` is set on Railway
- ✅ Verify Railway URL uses HTTPS (not HTTP)
- ✅ Check CORS headers include `Access-Control-Allow-Credentials: true`

**Issue: Cookie set but not sent with requests**

- ✅ Verify frontend is using `credentials: 'include'` in fetch
- ✅ Check cookie domain is not explicitly set (browser-managed)
- ✅ Verify `SameSite=None` and `Secure=true`

**Issue: Session returns null**

- ✅ Check backend logs for session validation errors
- ✅ Verify `BETTER_AUTH_SECRET` matches on both frontend and backend
- ✅ Check database for session record

### 4. Test Production Locally

You can test production configuration locally:

**Backend:**

```bash
cd backend
NODE_ENV=production npm run start:dev
```

**Frontend:**

```bash
cd frontend
npm run build
npm run start
```

Then access via `http://localhost:3000` and check if cookies work.

## Deployment Steps

### 1. Deploy Backend to Railway

```bash
cd backend
git add .
git commit -m "Fix production auth configuration"
git push
```

### 2. Set Railway Environment Variables

- Go to Railway dashboard
- Select your backend service
- Go to Variables tab
- Add/update all environment variables listed above
- **CRITICAL**: Set `NODE_ENV=production`

### 3. Deploy Frontend to Vercel

```bash
cd frontend
git add .
git commit -m "Fix production auth configuration"
git push
```

### 4. Set Vercel Environment Variables

- Go to Vercel dashboard
- Select your project
- Go to Settings > Environment Variables
- Add/update all environment variables listed above

### 5. Redeploy Both Services

- Trigger a redeploy on Railway (if not auto-deployed)
- Trigger a redeploy on Vercel (if not auto-deployed)

### 6. Test Production

1. Go to your production URL
2. Open DevTools > Network tab
3. Try to sign up or log in
4. Check for `Set-Cookie` header in response
5. Check Application > Cookies for the session cookie
6. Verify you can access protected routes

## Success Criteria

✅ Login sets a cookie with:

- Name: `better_auth.session_token`
- SameSite: `None`
- Secure: `true`
- HttpOnly: `true`

✅ Cookie is sent with subsequent requests

✅ Session is validated and user can access `/chat`

✅ Middleware redirects unauthenticated users to `/login`
