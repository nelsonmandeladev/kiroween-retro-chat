# Production Deployment Steps - WebSocket Fix

## Issue

The frontend is connecting to `ws://localhost:3001` instead of your Railway backend because environment variables in Next.js are embedded at build time.

## Solution

### Step 1: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variable for **Production** environment:
   ```
   NEXT_PUBLIC_WS_URL=https://kiroween-backend.appacheur.com
   ```
3. Save the variable

### Step 2: Update Railway Environment Variables

1. Go to Railway Dashboard → Your Backend Project → Variables
2. Add the following variable:
   ```
   FRONTEND_URL=https://kiroween-retrochat.appacheur.com
   ```
3. Save and redeploy

### Step 3: Trigger Redeployment

#### Vercel (Frontend)

**Option A - Redeploy from Dashboard:**

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the latest deployment
3. Click the three dots menu → "Redeploy"
4. Make sure "Use existing Build Cache" is **UNCHECKED**
5. Click "Redeploy"

**Option B - Push a commit:**

```bash
# In your frontend directory
git commit --allow-empty -m "Trigger rebuild with WebSocket env vars"
git push
```

#### Railway (Backend)

Railway should automatically redeploy when you add the environment variable. If not:

1. Go to Railway Dashboard → Your Backend Project
2. Click "Deploy" or trigger a manual deployment

### Step 4: Verify the Fix

After both deployments complete:

1. Open your production frontend in the browser
2. Open Developer Console (F12)
3. Check the Console tab for:
   ```
   WebSocket connected
   ```
4. Check the Network tab → WS (WebSocket) filter
   - You should see a connection to: `wss://kiroween-backend.appacheur.com/socket.io/...`
   - Status should be "101 Switching Protocols" (successful)

### Why This Happens

Next.js environment variables prefixed with `NEXT_PUBLIC_` are embedded into the JavaScript bundle at **build time**, not runtime. This means:

- Adding the variable to Vercel doesn't affect existing builds
- You must rebuild the application for the new variable to take effect
- The variable becomes part of the client-side JavaScript code

### Troubleshooting

If it still connects to localhost after redeployment:

1. **Clear Vercel build cache:**

   - In Vercel Dashboard → Settings → General
   - Scroll to "Build & Development Settings"
   - Clear build cache and redeploy

2. **Check the environment variable is set:**

   - In Vercel Dashboard → Settings → Environment Variables
   - Verify `NEXT_PUBLIC_WS_URL` is set for Production environment

3. **Verify the build output:**

   - Check Vercel deployment logs
   - Look for the environment variable being used during build

4. **Hard refresh your browser:**
   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear browser cache

## Expected Result

After successful deployment, the WebSocket connection should:

- Connect to `wss://kiroween-backend.appacheur.com`
- Stay connected without the disconnect/reconnect loop
- Show "WebSocket connected" in console
- Enable real-time messaging features
