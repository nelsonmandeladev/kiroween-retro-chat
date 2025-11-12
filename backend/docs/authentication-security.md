# Authentication Security

## Overview

RetroChat uses Better-auth for secure session-based authentication with enhanced security features for production deployments.

## Security Features

### Cookie Security

- **Custom Prefix**: All auth cookies use the `retrochat` prefix for namespace isolation
- **HTTP-Only**: Cookies are HTTP-only to prevent XSS attacks
- **Secure Flag**: Automatically enabled in production (requires HTTPS)
- **Cross-Subdomain Support**: Enabled for flexible deployment architectures
- **SameSite Policy**: Configured for CSRF protection

### Session Management

- **Cookie Cache**: 5-minute cache for improved performance
- **Session Validation**: All protected endpoints validate session on each request
- **Automatic Expiration**: Sessions expire based on Better-auth configuration

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

### Environment Variables

```bash
# Required
BETTER_AUTH_SECRET=<64-char-base64-string>
BETTER_AUTH_URL=<backend-url>
BETTER_AUTH_CLIENT_URL=<frontend-url>

# Optional
ALLOWED_ORIGINS=<additional-origins>
NODE_ENV=production
```

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
- Verify cross-subdomain settings if using subdomains
- Ensure cookies aren't being blocked by browser settings

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
- [ ] `ALLOWED_ORIGINS` includes only necessary domains
- [ ] Redis is configured and accessible
- [ ] Session expiration is configured appropriately
- [ ] Authentication flows tested in production environment

## References

- [Better-auth Documentation](https://better-auth.com)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Cookie Security Best Practices](https://owasp.org/www-community/controls/SecureCookieAttribute)
