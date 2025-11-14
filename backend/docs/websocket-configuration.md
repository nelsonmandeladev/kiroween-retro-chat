# WebSocket Configuration

## Overview

RetroChat uses Socket.io for real-time communication between the frontend and backend. Proper WebSocket configuration is essential for features like live messaging, typing indicators, and online status updates.

## Backend Configuration

### Environment Variable

The backend WebSocket gateway requires the `FRONTEND_URL` environment variable for CORS configuration:

```bash
# Development
FRONTEND_URL=http://localhost:3000

# Production
FRONTEND_URL=https://your-frontend-domain.com
```

### Gateway Implementation

The WebSocket gateway is configured in `backend/src/gateway/events.gateway.ts`:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway {
  // ...
}
```

### Authentication

WebSocket connections are authenticated using Better-auth session cookies:

1. Client connects with credentials (cookies)
2. Gateway validates session using `auth.api.getSession()`
3. If valid, connection is established and user ID is stored
4. If invalid, connection is immediately disconnected

## Frontend Configuration

### Environment Variable

The frontend WebSocket client requires the `NEXT_PUBLIC_WS_URL` environment variable:

```bash
# Development
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Production
NEXT_PUBLIC_WS_URL=https://your-backend-domain.com
```

### Client Implementation

The WebSocket client is configured in `frontend/lib/websocket/socket.service.ts`:

```typescript
const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

this.socket = io(url, {
  withCredentials: true, // Send cookies with connection
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
});
```

## Common Issues

### Issue: "io server disconnect" Error

**Symptoms:**

- WebSocket connects briefly then immediately disconnects
- Repeating connect/disconnect cycle in browser console
- Chat features don't work in real-time

**Cause:**

- `FRONTEND_URL` not set on backend, causing CORS rejection
- `NEXT_PUBLIC_WS_URL` not set on frontend, connecting to wrong URL

**Solution:**

1. Set `FRONTEND_URL` on backend (Railway/Render)
2. Set `NEXT_PUBLIC_WS_URL` on frontend (Vercel)
3. Redeploy both services
4. Verify URLs match your actual deployment URLs

### Issue: Connection Refused

**Symptoms:**

- WebSocket fails to connect at all
- "Connection refused" or "Failed to connect" errors

**Cause:**

- Backend not running or not accessible
- Incorrect `NEXT_PUBLIC_WS_URL` value
- Firewall or network blocking WebSocket connections

**Solution:**

1. Verify backend is running and accessible
2. Check `NEXT_PUBLIC_WS_URL` points to correct backend URL
3. Test backend health endpoint: `curl https://your-backend.com/`
4. Check platform logs for startup errors

### Issue: Authentication Failed

**Symptoms:**

- WebSocket connects but immediately disconnects
- "Invalid session" logs in backend

**Cause:**

- Session cookies not being sent with WebSocket connection
- `withCredentials: true` not set on client
- CORS not allowing credentials

**Solution:**

1. Verify `withCredentials: true` in socket.io client config
2. Check `FRONTEND_URL` matches the actual frontend domain
3. Ensure cookies are set with correct domain and SameSite attributes
4. Test authentication works for HTTP requests first

## Production Deployment

### Railway (Backend)

Add environment variable:

```
FRONTEND_URL=https://your-frontend-domain.com
```

### Vercel (Frontend)

Add environment variable:

```
NEXT_PUBLIC_WS_URL=https://your-backend-domain.com
```

### HTTPS Requirement

In production, both frontend and backend must use HTTPS:

- WebSocket connections upgrade from HTTPS to WSS (secure WebSocket)
- Mixed content (HTTP/HTTPS) will be blocked by browsers
- Ensure both domains have valid SSL certificates

## Testing WebSocket Connection

### Browser Console

After logging in, check the browser console:

**Success:**

```
WebSocket connected
```

**Failure:**

```
WebSocket disconnected: io server disconnect
WebSocket connection error: ...
```

### Network Tab

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to your backend URL
4. Check connection status and frames

### Backend Logs

Check backend logs for connection events:

```
[EventsGateway] Client attempting connection: <socket-id>
[EventsGateway] User <user-id> connected with socket <socket-id>
```

Or errors:

```
[EventsGateway] Invalid session for socket <socket-id>
[EventsGateway] Connection error: ...
```

## WebSocket Events

### Client → Server

- `message:send` - Send 1-on-1 message
- `user:typing` - Notify typing status
- `user:check-status` - Check online status
- `ai-friend:message` - Send AI Friend message
- `group:message:send` - Send group message
- `group:typing` - Group typing indicator
- `group:ai:mention` - Mention Group AI

### Server → Client

- `user:status` - User online/offline status
- `friend:request` - New friend request
- `friend:accepted` - Friend request accepted
- `message:receive` - New message received
- `message:sent` - Message sent confirmation
- `user:typing` - Friend typing
- `group:message:receive` - Group message received
- `group:typing` - Group member typing
- `ai-friend:stream-*` - AI Friend streaming events
- `group:ai:stream-*` - Group AI streaming events

## Reconnection Behavior

The client automatically reconnects on disconnection:

- **Initial delay**: 1 second
- **Max delay**: 30 seconds
- **Strategy**: Exponential backoff
- **Max attempts**: 10

After max attempts, manual page refresh is required.

## References

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io CORS Configuration](https://socket.io/docs/v4/handling-cors/)
- [WebSocket Security](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#security)
- [WEBSOCKET_FIX.md](../../WEBSOCKET_FIX.md) - Troubleshooting guide
