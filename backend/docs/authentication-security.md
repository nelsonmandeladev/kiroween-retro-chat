# Authentication Security

## Overview

RetroChat uses Better-auth for secure session-based authentication with enhanced security features for production deployments.

## Architecture

The authentication system uses a **backend-first architecture**:

1. **Backend (NestJS)**: Runs Better-auth server via `@thallesp/nestjs-better-auth` module
2. **Frontend (Next.js)**: Uses Better-auth React client that communicates with the backend
3. **API Proxy**: Next.js API route (`/api/auth/[...all]`) proxies requests to the backend

This architecture allows the backend to handle all authentication logic, session management, and database operations while the frontend provides a seamless client experience.

## Security Features

### Cookie Security

- **HTTP-Only**: Cookies are HTTP-only to prevent XSS attacks
- **Secure Flag**: Automatically enabled in production (requires HTTPS)
- **Domain Handling**: Domain attribute is not explicitly set, allowing the browser to handle it automatically for better cross-origin compatibility
- **SameSite Policy**: Configured for CSRF protection (`none` in production with `secure: true`, `lax` in development)

### Session Management

- **Cookie Cache**: 5-minute cache for improved performance
- **Session Validation**: All protected endpoints validate session on each request
- **Automatic Expiration**: Sessions expire based on Better-auth configuration
- **Cookie Domain**: Domain attribute is omitted to allow browser-managed cookie scoping, which improves cross-origin authentication compatibility with `sameSite: 'none'`

### CORS Protection

The backend accepts requests only from trusted origins:

1. **Primary Origin**: Set via `BETTER_AUTH_CLIENT_URL` (your main frontend)
2. **Additional Origins**: Set via `ALLOWED_ORIGINS` (comma-separated list)

Example configuration:

```bash
BETTER_AUTH_CLIENT_URL=https://yourapp.vercel.app
ALLOWED_ORIGINS=https://staging.yourapp.com,https://preview.yourapp.com
```

## Configuration

### Backend Environment Variables

```bash
# Required
BETTER_AUTH_SECRET=<64-char-base64-string>
BETTER_AUTH_URL=<backend-url>              # e.g., https://api.yourapp.com
BETTER_AUTH_CLIENT_URL=<frontend-url>      # e.g., https://yourapp.com
DATABASE_URL=<postgresql-connection-string>

# Optional
ALLOWED_ORIGINS=<additional-origins>       # Comma-separated list
NODE_ENV=production
```

### Frontend Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=<backend-url>          # e.g., https://api.yourapp.com
BETTER_AUTH_SECRET=<same-as-backend>       # Must match backend secret
BETTER_AUTH_URL=<frontend-url>             # e.g., https://yourapp.com
DATABASE_URL=<same-as-backend>             # Better-auth client needs DB access

# Optional
NEXT_PUBLIC_WS_URL=<websocket-url>         # Usually same as NEXT_PUBLIC_API_URL
```

**Important**: The `BETTER_AUTH_SECRET` and `DATABASE_URL` must be identical in both frontend and backend for session validation to work.

### Generating Secrets

Generate a secure secret for `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 64
```

**Important**: Use the same secret in both frontend and backend.

## Development vs Production

### Development Mode

- Secure cookies: **Disabled** (allows HTTP)
- Cookie cache: **Enabled**
- CORS: **Permissive** (localhost origins)

### Production Mode

- Secure cookies: **Enabled** (requires HTTPS)
- Cookie cache: **Enabled**
- CORS: **Strict** (only trusted origins)

Set `NODE_ENV=production` to enable production security features.

## Request Flow

### Authentication Request Flow

1. **User Action**: User submits login/signup form in frontend
2. **Client Call**: Frontend calls `signIn.email()` or `signUp.email()` from Better-auth React client
3. **API Proxy**: Request goes to Next.js API route `/api/auth/[...all]`
4. **Backend Proxy**: Next.js route proxies the request to backend `/api/auth/*`
5. **Better-auth Processing**: Backend Better-auth handles authentication
6. **Session Creation**: Backend creates session and sets cookies
7. **Response**: Cookies and session data returned through proxy chain
8. **Client Update**: Frontend Better-auth client updates session state

### Protected Route Access Flow

1. **User Navigation**: User navigates to protected route (e.g., `/chat`)
2. **Middleware Check**: Next.js middleware intercepts the request
3. **Cookie Validation**: Middleware checks for `better_auth.session_token` cookie existence
4. **Decision**:
   - If cookie exists → Allow access to page
   - If no cookie → Redirect to `/login`
5. **Component Load**: Page component loads and uses `useSession()` hook
6. **Session Sync**: Component syncs session data to Zustand auth store
7. **Data Fetch**: Component fetches user-specific data (friends, groups, messages)

### API Route Proxy

The frontend uses a catch-all API route to proxy authentication requests:

```typescript
// frontend/app/api/auth/[...all]/route.ts
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth', '');
  const backendUrl = `${API_URL}/api/auth${path}${url.search}`;

  const response = await fetch(backendUrl, {
    method: 'GET',
    headers: request.headers,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
```

This ensures cookies are properly set and CORS is handled correctly.

### Middleware Protection

Protected routes are guarded by Next.js middleware:

```typescript
// frontend/middleware.ts
export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/profile-setup/:path*'],
};
```

This provides a fast, edge-level authentication check before pages load. Note that middleware only checks cookie existence, not validity - actual session validation happens in components via `useSession()`.

## Automatic Profile Creation

When a user signs up, a profile is automatically created with:

- Default username (generated from email/name + timestamp)
- Display name (from registration)
- Empty status message
- No profile picture (can be uploaded later)

This ensures every authenticated user has a complete profile for chat features.

## Best Practices

### For Development

1. Use HTTP for local development
2. Set `BETTER_AUTH_CLIENT_URL=http://localhost:3000`
3. Keep `NODE_ENV=development`

### For Production

1. **Always use HTTPS** for both frontend and backend
2. Set `NODE_ENV=production`
3. Use strong, unique secrets (64+ characters)
4. Limit `ALLOWED_ORIGINS` to only necessary domains
5. Enable Redis for session storage
6. Monitor authentication logs for suspicious activity

### For Staging/Preview

1. Add preview URLs to `ALLOWED_ORIGINS`
2. Use separate secrets from production
3. Test authentication flows thoroughly before production

## Troubleshooting

### "Not authenticated" errors

- Check that cookies are being sent with requests
- Verify `BETTER_AUTH_SECRET` matches in frontend and backend
- Ensure frontend URL is in `BETTER_AUTH_CLIENT_URL` or `ALLOWED_ORIGINS`
- Clear browser cookies and try logging in again

### CORS errors

- Add the origin to `ALLOWED_ORIGINS`
- Verify `BETTER_AUTH_CLIENT_URL` is set correctly
- Check that the frontend is making requests to the correct backend URL

### Cookies not persisting

- In production, ensure both frontend and backend use HTTPS
- Check that `NODE_ENV=production` is set
- Verify cookie domain is not explicitly set (should be omitted for browser-managed scoping)
- For cross-origin setups, ensure `sameSite: 'none'` and `secure: true` are enabled in production
- Ensure cookies aren't being blocked by browser settings or third-party cookie restrictions
- Check browser DevTools → Application → Cookies to verify cookie attributes are correct

### Session expires too quickly

- Check Redis connection (sessions are stored in Redis)
- Verify Redis isn't evicting sessions due to memory limits
- Review Better-auth session configuration

## Security Checklist

Before deploying to production:

- [ ] `BETTER_AUTH_SECRET` is a strong, unique 64+ character string
- [ ] Same secret is used in both frontend and backend
- [ ] `NODE_ENV=production` is set
- [ ] Both frontend and backend use HTTPS
- [ ] `BETTER_AUTH_CLIENT_URL` points to production frontend
- [ ] `BETTER_AUTH_URL` points to production backend
- [ ] `ALLOWED_ORIGINS` includes only necessary domains
- [ ] Cookie configuration uses `sameSite: 'none'` and `secure: true` in production for cross-origin support
- [ ] Cookie domain is not explicitly set (browser-managed for better compatibility)
- [ ] Redis is configured and accessible
- [ ] Session expiration is configured appropriately
- [ ] Authentication flows tested in production environment

## References

- [Better-auth Documentation](https://better-auth.com)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Cookie Security Best Practices](https://owasp.org/www-community/controls/SecureCookieAttribute)
