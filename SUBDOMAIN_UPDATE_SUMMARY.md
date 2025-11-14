# Subdomain Update Summary

## Overview

All environment files and documentation have been updated to use the new appacheur.com subdomains:

- **Frontend**: `https://kiroween-retrochat.appacheur.com`
- **Backend**: `https://kiroween-backend.appacheur.com`

## Files Updated

### Environment Files

1. **backend/.env.production**

   - `BETTER_AUTH_URL=https://kiroween-backend.appacheur.com`
   - `BETTER_AUTH_CLIENT_URL=https://kiroween-retrochat.appacheur.com`
   - `ALLOWED_ORIGINS=https://kiroween-retrochat.appacheur.com`
   - `FRONTEND_URL=https://kiroween-retrochat.appacheur.com`

2. **backend/.env.example**

   - Updated documentation for `FRONTEND_URL`

3. **frontend/.env.production**

   - `BETTER_AUTH_URL=https://kiroween-retrochat.appacheur.com`
   - `NEXT_PUBLIC_API_URL=https://kiroween-backend.appacheur.com`
   - `NEXT_PUBLIC_WS_URL=https://kiroween-backend.appacheur.com`

4. **frontend/.env.example**
   - Updated documentation for `NEXT_PUBLIC_WS_URL`

### Documentation Files

1. **WEBSOCKET_FIX.md**

   - Updated all Railway and Vercel URLs
   - Updated deployment instructions

2. **PRODUCTION_DEPLOYMENT_STEPS.md**

   - Updated environment variable values
   - Updated verification URLs

3. **DEPLOYMENT_CHECKLIST.md**

   - Updated all backend and frontend URLs
   - Updated example subdomain references

4. **debug-production-auth.md**

   - Updated curl command examples
   - Updated browser testing URLs
   - Updated troubleshooting steps

5. **README.md**

   - Updated authentication documentation example

6. **DEPLOYMENT_SETUP.md**
   - Updated environment variable examples

## Next Steps - Deploy to Production

### 1. Update Railway Environment Variables

Go to Railway Dashboard → Your Backend Project → Variables and update:

```bash
BETTER_AUTH_URL=https://kiroween-backend.appacheur.com
BETTER_AUTH_CLIENT_URL=https://kiroween-retrochat.appacheur.com
ALLOWED_ORIGINS=https://kiroween-retrochat.appacheur.com
FRONTEND_URL=https://kiroween-retrochat.appacheur.com
```

### 2. Update Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables and update:

```bash
BETTER_AUTH_URL=https://kiroween-retrochat.appacheur.com
NEXT_PUBLIC_API_URL=https://kiroween-backend.appacheur.com
NEXT_PUBLIC_WS_URL=https://kiroween-backend.appacheur.com
```

### 3. Configure Custom Domains

#### Railway (Backend)

1. Go to Railway Dashboard → Your Backend Project → Settings
2. Add custom domain: `kiroween-backend.appacheur.com`
3. Add the CNAME record to your DNS provider as instructed by Railway

#### Vercel (Frontend)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add custom domain: `kiroween-retrochat.appacheur.com`
3. Add the CNAME record to your DNS provider as instructed by Vercel

### 4. Redeploy Both Services

**Important**: After updating environment variables, you MUST redeploy:

#### Railway

- Should auto-deploy when you save environment variables
- Or manually trigger deployment from the dashboard

#### Vercel

- Go to Deployments tab
- Click "Redeploy" on the latest deployment
- **UNCHECK** "Use existing Build Cache" (critical for env vars to take effect)

### 5. Verify the Deployment

After both deployments complete:

1. Visit `https://kiroween-retrochat.appacheur.com`
2. Open DevTools (F12) → Console
3. Try to sign up or log in
4. Check for:
   - ✅ No CORS errors
   - ✅ "WebSocket connected" message
   - ✅ Successful authentication
   - ✅ Cookie set with domain `.appacheur.com`

## DNS Configuration

Make sure your DNS provider (where appacheur.com is registered) has these CNAME records:

```
kiroween-retrochat.appacheur.com → [Vercel CNAME target]
kiroween-backend.appacheur.com → [Railway CNAME target]
```

The exact CNAME targets will be provided by Vercel and Railway when you add the custom domains.

## Troubleshooting

If authentication still fails after deployment:

1. **Check DNS propagation**: Use `dig kiroween-retrochat.appacheur.com` to verify DNS is resolving
2. **Clear browser cache**: Hard refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. **Check SSL certificates**: Both domains should have valid HTTPS certificates
4. **Verify environment variables**: Check Railway and Vercel dashboards to confirm all variables are set
5. **Check logs**: Review Railway logs for any authentication errors

## Benefits of This Setup

✅ **Cross-subdomain authentication works** - Cookies can be shared between subdomains
✅ **WebSocket connections work** - CORS properly configured
✅ **Professional URLs** - Using your own domain instead of platform defaults
✅ **Better security** - Proper cookie domain configuration
✅ **Easier debugging** - Consistent URLs across all documentation
