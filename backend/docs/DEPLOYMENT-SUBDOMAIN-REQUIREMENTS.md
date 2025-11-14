# Subdomain Deployment Requirements

## Overview

RetroChat's production authentication requires both frontend and backend to be deployed on **subdomains of the same domain** (`appacheur.com`). This is due to the cross-subdomain cookie configuration that enables session sharing across services.

## Why Subdomains Are Required

The authentication system uses Better-auth with cross-subdomain cookies configured as follows:

```typescript
crossSubDomainCookies: {
  enabled: true,
  domain: '.appacheur.com', // Leading dot allows sharing across subdomains
}
```

This configuration:

- Sets cookies with `domain=.appacheur.com`
- Allows cookies to be shared across all `*.appacheur.com` subdomains
- Enables seamless authentication between frontend and backend

## Required Setup

### Domain Configuration

You must have:

1. A custom domain (e.g., `appacheur.com`)
2. Two subdomains configured:
   - Frontend: `app.appacheur.com` (or any subdomain)
   - Backend: `api.appacheur.com` (or any subdomain)

### DNS Configuration

Set up DNS records to point to your hosting providers:

```
app.appacheur.com  →  CNAME  →  cname.vercel-dns.com
api.appacheur.com  →  CNAME  →  your-railway-app.up.railway.app
```

### Platform Configuration

#### Vercel (Frontend)

1. Go to Project Settings → Domains
2. Add custom domain: `app.appacheur.com`
3. Follow Vercel's DNS configuration instructions
4. Wait for SSL certificate provisioning

#### Railway (Backend)

1. Go to Service Settings → Networking
2. Add custom domain: `api.appacheur.com`
3. Configure DNS as instructed
4. Wait for SSL certificate provisioning

### Environment Variables

Update your environment variables to use the subdomain URLs:

**Backend:**

```bash
BETTER_AUTH_URL=https://api.appacheur.com
BETTER_AUTH_CLIENT_URL=https://app.appacheur.com
NODE_ENV=production
```

**Frontend:**

```bash
BETTER_AUTH_URL=https://app.appacheur.com
NEXT_PUBLIC_API_URL=https://api.appacheur.com
```

## What Won't Work

❌ **Different Domains**: Using different domains will not work:

- Frontend: `myapp.vercel.app`
- Backend: `myapp.railway.app`

❌ **Different Root Domains**: Using different root domains will not work:

- Frontend: `app.example.com`
- Backend: `api.different.com`

❌ **HTTP**: Both services must use HTTPS (required for `sameSite: 'none'`)

## Alternative: Different Domains

If you cannot use subdomains, you need to modify the authentication configuration:

1. Remove the `crossSubDomainCookies` configuration
2. Rely on browser-managed cookie scoping
3. Accept that cookies won't be shared across different domains
4. Use alternative authentication methods (e.g., token-based)

See `backend/docs/CHANGELOG-cross-subdomain-cookies.md` for details on reverting the configuration.

## Verification

After deployment, verify the setup:

1. **Check Cookie Domain**:
   - Log in at `https://app.appacheur.com/login`
   - Open DevTools → Application → Cookies
   - Verify cookie domain is `.appacheur.com` (with leading dot)

2. **Check Cookie Sharing**:
   - Navigate to `/chat`
   - Open DevTools → Network
   - Check requests to `api.appacheur.com` include the session cookie

3. **Test Authentication**:
   - Log in successfully
   - Navigate to protected routes
   - Verify session persists across page refreshes

## Cost Considerations

### Domain Purchase

- Cost: ~$10-15/year for `.com` domain
- Providers: Namecheap, Google Domains, Cloudflare

### Hosting

- Vercel: Free tier supports custom domains
- Railway: Free tier supports custom domains
- SSL certificates: Free (Let's Encrypt via platforms)

### Total Additional Cost

- **$10-15/year** for domain only
- No additional hosting costs

## Development vs Production

### Development (Localhost)

- No subdomain required
- Uses `localhost:3000` and `localhost:3001`
- Cookies work without domain attribute

### Production (Subdomains)

- Requires custom domain with subdomains
- Uses `app.appacheur.com` and `api.appacheur.com`
- Cookies use `domain=.appacheur.com`

## Troubleshooting

or `nslookup` to verify DNS records

- Check SSL certificate is provisioned

## References

- [Better-auth Cross-Subdomain Cookies](https://better-auth.com/docs/concepts/session-management#cross-subdomain-cookies)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Railway Custom Domains](https://docs.railway.app/deploy/exposing-your-app#custom-domains)

### Cookies Not Set

- Verify both URLs use HTTPS
- Check `NODE_ENV=production` is set
- Verify URLs are subdomains of `appacheur.com`

### Cookies Not Sent

- Check cookie domain is `.appacheur.com` (with leading dot)
- Verify both services are on `*.appacheur.com` subdomains
- Check browser allows third-party cookies

### DNS Issues

- Wait 24-48 hours for DNS propagation
- Use `dig`
