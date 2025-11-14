# Cross-Subdomain Cookie Configuration

## Date: November 14, 2025

## Change Summary

Enabled cross-subdomain cookie support in production to allow authentication across subdomains of `appacheur.com` (e.g., `api.appacheur.com` and `app.appacheur.com`).

## Previous Configuration

```typescript
advanced: {
  useSecureCookies: isProduction,
  cookies: {
    session_token: {
      attributes: {
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        httpOnly: true,
        path: '/',
        // Domain not set - browser-managed
      },
    },
  },
}
```

## New Configuration

```typescript
advanced: {
  useSecureCookies: isProduction,
  // Enable cross-subdomain cookies for production
  ...(isProduction && {
    crossSubDomainCookies: {
      enabled: true,
      domain: '.appacheur.com', // Leading dot allows sharing across subdomains
    },
  }),
  // Environment-specific cookie attributes
  defaultCookieAttributes: isProduction
    ? {
      sameSite: 'none', // Required for cross-subdomain cookies
      secure: true, // Required for SameSite=None (HTTPS only)
      path: '/',
    }
    : {
      sameSite: 'lax', // More flexible for localhost development
      secure: false, // HTTP cookies (localhost)
      path: '/',
    },
}
```

## Rationale

### Why This Change Was Made

1. **Subdomain Architecture**: The application uses separate subdomains for frontend (`app.appacheur.com`) and backend (`api.appacheur.com`), requiring cookies to be shared across subdomains.

2. **Better-auth Cross-Subdomain Support**: Better-auth provides built-in `crossSubDomainCookies` configuration specifically for this use case.

3. **Explicit Domain Configuration**: Setting `domain: '.appacheur.com'` (with leading dot) allows cookies to be shared across all subdomains of `appacheur.com`.

4. **Production-Only**: Cross-subdomain configuration is only enabled in production, keeping development simple with localhost.

## Impact

### What Changed

- Production cookies now have `domain=.appacheur.com` attribute
- Cookies are shared across all `*.appacheur.com` subdomains
- `crossSubDomainCookies` feature explicitly enabled in Better-auth config
- Cookie attributes moved to `defaultCookieAttributes` for cleaner configuration

### What Stayed the Same

- `sameSite: 'none'` and `secure: true` in production
- `sameSite: 'lax'` and `secure: false` in development
- HTTP-only and path attributes
- All other authentication behavior

### Deployment Requirements

For this configuration to work, you must:

1. **Use Subdomain Architecture**: Deploy frontend and backend on subdomains of the same domain
   - ✅ Frontend: `app.appacheur.com`
   - ✅ Backend: `api.appacheur.com`
   - ❌ Frontend: `myapp.vercel.app`, Backend: `myapp.railway.app` (different domains won't work)

2. **HTTPS Required**: Both subdomains must use HTTPS (required for `sameSite: 'none'`)

3. **Environment Variables**: Update production environment variables to use subdomain URLs:
   ```bash
   BETTER_AUTH_URL=https://api.appacheur.com
   BETTER_AUTH_CLIENT_URL=https://app.appacheur.com
   ```

## Testing

After this change, verify:

1. ✅ Cookies are set with `domain=.appacheur.com` in production
2. ✅ Cookies are sent from `app.appacheur.com` to `api.appacheur.com`
3. ✅ Authentication works across subdomains
4. ✅ Session validation succeeds
5. ✅ Development mode still works with localhost (no domain attribute)

### Browser DevTools Verification

1. Log in at `https://app.appacheur.com/login`
2. Open DevTools → Application → Cookies
3. Check cookie for `https://api.appacheur.com`:
   - Name: `better_auth.session_token`
   - Domain: `.appacheur.com` (note the leading dot)
   - Path: `/`
   - Secure: ✓
   - HttpOnly: ✓
   - SameSite: None

## Migration from Different Domains

If you're currently using different domains (e.g., Vercel and Railway), you have two options:

### Option 1: Use Custom Subdomains (Recommended)

1. Purchase a domain (e.g., `appacheur.com`)
2. Set up DNS records:
   - `app.appacheur.com` → Vercel
   - `api.appacheur.com` → Railway
3. Configure custom domains in Vercel and Railway
4. Update environment variables to use subdomain URLs
5. Redeploy both services

### Option 2: Revert to Cross-Origin Configuration

If you can't use subdomains, revert to the previous configuration:

```typescript
advanced: {
  useSecureCookies: isProduction,
  defaultCookieAttributes: isProduction
    ? {
      sameSite: 'none',
      secure: true,
      path: '/',
      // Don't set domain - browser-managed
    }
    : {
      sameSite: 'lax',
      secure: false,
      path: '/',
    },
}
```

This works for cross-origin setups but cookies won't be shared across different domains.

## Documentation Updated

The following documentation files were updated to reflect this change:

- `backend/docs/authentication-security.md` - Cookie security and troubleshooting sections
- `DEPLOYMENT_CHECKLIST.md` - Production deployment requirements
- `debug-production-auth.md` - Cookie verification steps

## References

- [Better-auth Cross-Subdomain Cookies](https://better-auth.com/docs/concepts/session-management#cross-subdomain-cookies)
- [MDN: Set-Cookie Domain Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#domain)
- [SameSite Cookie Best Practices](https://web.dev/samesite-cookies-explained/)
