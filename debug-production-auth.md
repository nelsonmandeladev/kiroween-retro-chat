# Debug Production Authentication

## Quick Checks

### 1. Verify Railway Environment Variables

SSH into Railway or check the dashboard to confirm:

```bash
echo $NODE_ENV  # Should be: production
echo $BETTER_AUTH_URL  # REQUIRED: https://api.appacheur.com (or your backend subdomain)
echo $BETTER_AUTH_CLIENT_URL  # REQUIRED: https://app.appacheur.com (or your frontend subdomain)
echo $ALLOWED_ORIGINS  # Optional: Additional origins (comma-separated)
```

**Critical**:

- `BETTER_AUTH_URL` and `BETTER_AUTH_CLIENT_URL` are required in production with no fallback values
- Both URLs must be subdomains of `appacheur.com` for cross-subdomain authentication to work
- If either is missing or not on the correct domain, authentication will fail

### 2. Test Backend Auth Endpoint

```bash
curl -X POST https://api.appacheur.com/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "Origin: https://app.appacheur.com" \
  -d '{"email":"test@example.com","password":"testpassword"}' \
  -v
```

Look for in the response:

- `Set-Cookie` header with `better_auth.session_token`
- Cookie attributes: `Domain=.appacheur.com; SameSite=None; Secure; HttpOnly`
- `Access-Control-Allow-Credentials: true`

### 3. Browser DevTools Check (Production Site)

1. Go to: `https://app.appacheur.com/login` (or your frontend subdomain)
2. Open DevTools (F12)
3. Go to Network tab
4. Try to log in
5. Click on the `/sign-in/email` request
6. Check Response Headers:

```
Set-Cookie: better_auth.session_token=...; Domain=.appacheur.com; Path=/; HttpOnly; Secure; SameSite=None
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://app.appacheur.com
```

7. Go to Application tab > Cookies > https://api.appacheur.com (or your backend subdomain)
8. Verify cookie exists with:
   - Name: `better_auth.session_token`
   - Value: (some token)
   - Domain: `.appacheur.com` (with leading dot for subdomain sharing)
   - Path: `/`
   - Secure: ✓
   - HttpOnly: ✓
   - SameSite: None

### 4. Check if Cookie is Sent

1. After login, stay in Network tab
2. Navigate to `/chat` or any protected route
3. Click on any request to the backend
4. Check Request Headers:

```
Cookie: better_auth.session_token=...
```

If the cookie is NOT being sent, it's a browser security issue.

## Common Production Issues

### Issue 1: Cookie Not Set

**Symptoms:** No `Set-Cookie` header in login response

**Causes:**

- `NODE_ENV` not set to `production` on Railway
- `BETTER_AUTH_URL` or `BETTER_AUTH_CLIENT_URL` not set (required in production)
- Backend not using HTTPS
- CORS not configured properly
- Frontend and backend not on subdomains of `appacheur.com`

**Fix:**

1. Set `NODE_ENV=production` on Railway
2. Set `BETTER_AUTH_URL` to your backend subdomain (e.g., `https://api.appacheur.com`)
3. Set `BETTER_AUTH_CLIENT_URL` to your frontend subdomain (e.g., `https://app.appacheur.com`)
4. Verify both URLs use `https://` and are subdomains of `appacheur.com`
5. Check CORS allows credentials

### Issue 2: Cookie Set But Not Sent

**Symptoms:** Cookie appears in DevTools but not sent with requests

**Causes:**

- `SameSite=None` requires `Secure=true`
- Domain mismatch (frontend and backend not on same domain)
- Browser blocking third-party cookies
- Cookie domain not configured for subdomains

**Fix:**

1. Verify cookie has both `SameSite=None` AND `Secure=true`
2. Check cookie domain is set to `.appacheur.com` (with leading dot)
3. Verify both frontend and backend are on `*.appacheur.com` subdomains
4. Test in different browser (Chrome, Firefox)
5. Check browser settings allow third-party cookies

### Issue 3: Session Returns Null

**Symptoms:** Cookie is sent but session validation fails

**Causes:**

- `BETTER_AUTH_SECRET` mismatch
- Session expired
- Database connection issue

**Fix:**

1. Verify secrets match exactly on frontend and backend
2. Check Railway logs for errors
3. Verify database connection

## Testing Locally with Production Config

To test production configuration locally:

### Backend:

```bash
cd backend
export NODE_ENV=production
export BETTER_AUTH_URL=http://localhost:3001
export BETTER_AUTH_CLIENT_URL=http://localhost:3000
export ALLOWED_ORIGINS=http://localhost:3000
npm run start:dev
```

### Frontend:

```bash
cd frontend
export NEXT_PUBLIC_API_URL=http://localhost:3001
npm run build
npm run start
```

This simulates production cookie behavior locally.

## Railway Logs to Check

```bash
# Check for auth-related logs
railway logs --filter "auth"

# Check for cookie-related logs
railway logs --filter "cookie"

# Check for CORS errors
railway logs --filter "CORS"

# Check for session errors
railway logs --filter "session"
```

## Next Steps if Still Not Working

1. **Add Debug Logging:**

Add to `backend/src/lib/auth.ts`:

```typescript
console.log("Auth Config:", {
  isProduction,
  baseURL: currentConfig.baseURL,
  clientURL: currentConfig.clientURL,
  allowedOrigins: currentConfig.allowedOrigins,
  useSecureCookies: isProduction,
});
```

2. **Check Response Headers:**

Add to `backend/src/main.ts` after CORS:

```typescript
app.use((req, res, next) => {
  console.log("Request from:", req.headers.origin);
  console.log("Cookies:", req.headers.cookie);
  next();
});
```

3. **Verify Cookie in Response:**

After login, check Railway logs for the Set-Cookie header being sent.

4. **Contact Support:**

If all else fails, the issue might be:

- Railway proxy stripping cookies
- Vercel edge network blocking cookies
- Browser security policy

Try deploying to different platforms (e.g., Render, Fly.io) to isolate the issue.
