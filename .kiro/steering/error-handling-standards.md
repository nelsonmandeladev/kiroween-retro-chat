---
inclusion: always
---

# Error Handling Standards

## Philosophy

All errors should be handled gracefully with user-friendly messages. Never expose technical details or stack traces to end users.

## Error Handler Usage

Use the centralized error handler from `lib/utils/error-handler.ts`:

```typescript
import { handleError } from "@/lib/utils/error-handler";

try {
  await riskyOperation();
} catch (error) {
  handleError(error, "Operation Context");
}
```

## Error Categories

### Network Errors

- **Display**: "Connection lost. Please check your internet."
- **Action**: Show retry button
- **Logging**: Log full error details

### Authentication Errors

- **Display**: "Session expired. Please log in again."
- **Action**: Redirect to login page
- **Logging**: Log user ID and timestamp

### Validation Errors

- **Display**: Specific field error (e.g., "Username must be 3-20 characters")
- **Action**: Highlight invalid field
- **Logging**: Log validation rule that failed

### WebSocket Errors

- **Display**: "Real-time connection lost. Reconnecting..."
- **Action**: Automatic reconnection with exponential backoff
- **Logging**: Log connection state and retry attempts

### API Errors

- **400 Bad Request**: Show validation message from server
- **401 Unauthorized**: Redirect to login
- **403 Forbidden**: "You don't have permission to do that"
- **404 Not Found**: "That resource doesn't exist"
- **500 Server Error**: "Something went wrong. Please try again"

### AI Service Errors

- **Display**: "AI Friend is taking a break. Try again in a moment."
- **Action**: Allow retry after 5 seconds
- **Logging**: Log AI service response and user context

## Error Boundaries

Wrap major sections in error boundaries:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <ChatWindow />
</ErrorBoundary>
```

## User Notifications

Use toast notifications for errors:

- **Duration**: 5 seconds for errors, 3 seconds for success
- **Position**: Top-right corner
- **Style**: Red background for errors, green for success
- **Dismissible**: Always include close button

## Validation

### Frontend Validation

- Validate all inputs before submission
- Show inline error messages
- Disable submit button until valid
- Use the validation utilities from `lib/utils/validation.ts`

### Backend Validation

- Always validate on backend even if frontend validates
- Return clear error messages
- Use HTTP status codes correctly

## Logging

### Development

- Log all errors to console with full stack traces
- Log WebSocket events for debugging
- Log state changes in stores

### Production

- Send errors to monitoring service (future: Sentry)
- Log user actions leading to errors
- Never log sensitive data (passwords, tokens)

## Retry Logic

### Automatic Retry

- Network requests: 3 retries with exponential backoff
- WebSocket reconnection: Infinite retries with max 30s delay
- AI requests: 2 retries with 5s delay

### Manual Retry

- Show "Try Again" button for failed operations
- Clear error state on retry
- Show loading state during retry

## Error Messages

### Good Examples

- ✅ "Username is already taken"
- ✅ "Message failed to send. Try again?"
- ✅ "You need to be a group admin to do that"

### Bad Examples

- ❌ "Error: ECONNREFUSED"
- ❌ "Unhandled promise rejection"
- ❌ "500 Internal Server Error"

## Testing Error Scenarios

Always test:

- Network disconnection during operations
- Invalid user inputs
- Expired authentication tokens
- WebSocket disconnection and reconnection
- API rate limiting
- Concurrent operations conflicts
