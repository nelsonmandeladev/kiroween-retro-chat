# Cookie Domain Configuration Change

## Date: November 12, 2025

## Change Summary

Removed explicit `domain` attribute from session cookie configuration in `backend/src/lib/auth.ts`.

## Previous Configuration

```typescript
cookies: {
  session_token: {
    attributes: {
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      httpOnly: true,
      path: '/',
      domain: currentConfig.baseURL,  // ❌ Explicitly set
    },
  },
}
```

## New Configuration

```typescript
cookies: {
  session_token: {
    attributes: {
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      httpOnly: true,
      path: '/',
      // ✅ Domain not set - browser manages it
    },
  },
}
```

## Rationale

### Why This Change Was Made

1. **Better Cross-Origin Compatibility**: When `domain` is not explicitly set, browsers handle cookie scoping automatically, which works better with `sameSite: 'none'` for cross-origin authentication.

2. **Simplified Configuration**: Removes the need to configure the domain attribute, reducing potential misconfiguration issues.

3. **Browser-Managed Scoping**: Modern browsers are better at managing cookie scope when the domain is omitted, especially in cross-origin scenarios.

4. **Follows Best Practices**: Many authentication libraries recommend omitting the domain attribute for cross-origin setups with `sameSite: 'none'`.

## Impact

### What Changed

- Session cookies no longer have an explicit `domain` attribute
- Browsers now manage cookie scoping automatically
- Cross-origin authentication should work more reliably

### What Stayed the Same

- `sameSite: 'none'` in production (with `secure: true`)
- `sameSite: 'lax'` in development
- HTTP-only and secure flags
- Cookie path (`/`)
- All other authentication behavior

## Testing

After this change, verify:

1. ✅ Cookies are set correctly after login
2. ✅ Cookies are sent with subsequent requests
3. ✅ Cross-origin authentication works (frontend on Vercel, backend on Railway)
4. ✅ Session validation succeeds
5. ✅ Protected routes are accessible after authentication

## Documentation Updated

The following documentation files were updated to reflect this change:

- `backend/docs/authentication-security.md` - Cookie security section
- `backend/API_DOCUMENTATION.md` - No changes needed (high-level only)
- `DEPLOYMENT_CHECKLIST.md` - Cookie troubleshooting section
- `debug-production-auth.md` - Cookie verification steps

## References

- [MDN: Set-Cookie Domain Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#domain)
- [Better-auth Cookie Configuration](https://better-auth.com/docs/concepts/session-management)
- [SameSite Cookie Best Practices](https://web.dev/samesite-cookies-explained/)
