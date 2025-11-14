# Required Environment Variables Change

## Date: November 14, 2025

## Change Summary

Removed fallback values for production environment variables in `backend/src/lib/auth.ts`, making `BETTER_AUTH_URL` and `BETTER_AUTH_CLIENT_URL` strictly required in production.

## Previous Configuration

```typescript
production: {
  baseURL:
    process.env.BETTER_AUTH_URL ||
    'https://kiiroween-retrochat-backend-production.up.railway.app',
  clientURL:
    process.env.BETTER_AUTH_CLIENT_URL ||
    'https://kiiroween-retrochat-frontend.vercel.app',
  allowedOrigins: [
    process.env.BETTER_AUTH_CLIENT_URL ||
    'https://kiiroween-retrochat-frontend.vercel.app',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  ],
}
```

## New Configuration

```typescript
production: {
  baseURL: process.env.BETTER_AUTH_URL,
  clientURL: process.env.BETTER_AUTH_CLIENT_URL,
  allowedOrigins: [
    process.env.BETTER_AUTH_CLIENT_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
  ],
}
```

## Rationale

### Why This Change Was Made

1. **Explicit Configuration**: Forces explicit configuration of production URLs, preventing accidental use of hardcoded values.

2. **Fail-Fast Behavior**: Application will fail to start if required environment variables are missing, making configuration issues immediately visible.

3. **Security Best Practice**: Removes hardcoded production URLs from source code, following the principle of environment-based configuration.

4. **Deployment Flexibility**: Allows different deployments without code changes, supporting multiple environments (staging, production, etc.).

## Impact

### What Changed

- `BETTER_AUTH_URL` is now required in production (no fallback)
- `BETTER_AUTH_CLIENT_URL` is now required in production (no fallback)
- Application will fail to start if these variables are not set when `NODE_ENV=production`

### What Stayed the Same

- Development mode still uses hardcoded localhost URLs
- `ALLOWED_ORIGINS` remains optional for additional trusted origins
- All other authentication behavior unchanged

## Migration Guide

### For Existing Deployments

If you're already deployed and these environment variables are set, no action is needed. The change only affects deployments where these variables were missing and relying on fallback values.

### For New Deployments

You MUST set these environment variables in production:

```bash
NODE_ENV=production
BETTER_AUTH_URL=https://your-backend-domain.com
BETTER_AUTH_CLIENT_URL=https://your-frontend-domain.com
```

### Verification

After deployment, check that your backend starts successfully. If you see errors about undefined URLs, set the required environment variables.

## Testing

After this change, verify:

1. ✅ Backend starts successfully in production with environment variables set
2. ✅ Backend fails to start if `BETTER_AUTH_URL` is missing in production
3. ✅ Backend fails to start if `BETTER_AUTH_CLIENT_URL` is missing in production
4. ✅ Development mode still works without environment variables
5. ✅ Authentication flows work correctly in production

## Documentation Updated

The following documentation files were updated to reflect this change:

- `backend/docs/authentication-security.md` - Environment variables section
- `DEPLOYMENT_CHECKLIST.md` - Critical settings and troubleshooting
- `debug-production-auth.md` - Environment variable verification steps

## Related Changes

- Fixed TypeScript error by filtering undefined values from `trustedOrigins` array
- Added type guard to ensure only defined origin strings are passed to Better-auth

## References

- [Twelve-Factor App: Config](https://12factor.net/config)
- [Better-auth Configuration](https://better-auth.com/docs/concepts/configuration)
