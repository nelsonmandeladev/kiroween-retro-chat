# WebSocket Connection Fix

## Problem

WebSocket connections were failing in production with "io server disconnect" error because:

1. Backend WebSocket gateway was missing `FRONTEND_URL` environment variable
2. Frontend was missing `NEXT_PUBLIC_WS_URL` environment variable

## Solution

### Backend (Railway)

Add this environment variable to your Railway deployment:

```
FRONTEND_URL=https://kiiroween-retrochat-frontend.vercel.app
```

**Steps:**

1. Go to Railway dashboard
2. Select your backend project
3. Go to Variables tab
4. Add new variable: `FRONTEND_URL` = `https://kiiroween-retrochat-frontend.vercel.app`
5. Redeploy the backend

### Frontend (Vercel)

Add this environment variable to your Vercel deployment:

```
NEXT_PUBLIC_WS_URL=https://kiiroween-retrochat-backend-production.up.railway.app
```

**Steps:**

1. Go to Vercel dashboard
2. Select your frontend project
3. Go to Settings → Environment Variables
4. Add new variable: `NEXT_PUBLIC_WS_URL` = `https://kiiroween-retrochat-backend-production.up.railway.app`
5. Redeploy the frontend

## Why This Fixes It

### Backend Issue

The WebSocket gateway uses `FRONTEND_URL` for CORS configuration:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
```

Without `FRONTEND_URL`, it was falling back to `http://localhost:3000`, which doesn't match your production frontend URL. This caused the server to reject the connection immediately after accepting it.

### Frontend Issue

The socket service needs to know where to connect:

```typescript
const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
```

Without `NEXT_PUBLIC_WS_URL`, it was trying to connect to `http://localhost:3001` instead of your Railway backend.

## Verification

After deploying both changes, you should see in the browser console:

```
WebSocket connected
```

Instead of the repeating disconnect/reconnect cycle.

## Files Updated

- `backend/.env.production` - Added FRONTEND_URL
- `backend/.env.example` - Documented FRONTEND_URL
- `frontend/.env.production` - Added NEXT_PUBLIC_WS_URL
- `frontend/.env.example` - Documented NEXT_PUBLIC_WS_URL
