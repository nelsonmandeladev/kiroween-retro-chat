# Error Handling and Validation Implementation

This document describes the comprehensive error handling and validation system implemented for the RetroChat frontend.

## Overview

The error handling system provides:

- Centralized error parsing and handling
- User-friendly error messages with retry options
- Specific error handling for groups, AI, and WebSocket connections
- Comprehensive input validation and sanitization
- XSS prevention through content sanitization

## Error Handling

### Core Error Handler (`error-handler.ts`)

#### Error Types

- `NETWORK`: Network connectivity issues (retryable)
- `AUTHENTICATION`: Authentication failures (401)
- `AUTHORIZATION`: Permission denied (403)
- `VALIDATION`: Invalid input (400)
- `NOT_FOUND`: Resource not found (404)
- `SERVER`: Server errors (500+, retryable)
- `UNKNOWN`: Unclassified errors

#### Key Functions

**`parseHttpError(error, defaultMessage)`**

- Parses any error into an `AppError` instance
- Automatically detects error types from HTTP status codes
- Determines if errors are retryable

**`handleError(error, onRetry, customMessage)`**

- Handles errors with automatic toast display
- Shows retry button for retryable errors
- Returns parsed `AppError` for further handling

**`handleGroupError(error, onRetry)`**

- Specialized handler for group-specific errors
- Handles: NOT_GROUP_MEMBER, NOT_GROUP_ADMIN, GROUP_NOT_FOUND, GROUP_DELETED
- Provides context-specific error messages

**`handleWebSocketError(error)`**

- Handles WebSocket connection errors
- Shows reconnection status to users

**`handleAIError(error, isGroupAI)`**

- Handles AI-specific errors
- Differentiates between AI Friend and Group AI
- Shows learning status messages

### API Client Integration

The API client (`client.ts`) has been updated to:

- Throw `AppError` instances with proper error types
- Automatically determine if errors are retryable
- Handle network errors gracefully
- Preserve error details for debugging

### WebSocket Error Handling

The WebSocket service (`socket.service.ts`) now:

- Shows user-friendly connection status messages
- Implements exponential backoff for reconnection
- Displays success message on reconnection
- Handles AI streaming errors with toast notifications
- Limits error toast frequency to avoid spam

### Store Integration

The group store (`group-store.ts`) now:

- Uses `handleGroupError` for all group operations
- Provides retry callbacks for failed operations
- Handles group deletion gracefully
- Shows appropriate error messages for permission issues

## Input Validation

### Validation Utilities (`validation.ts`)

#### Group Validation

**`validateGroupName(name)`**

- Required field
- Max 50 characters
- No leading/trailing whitespace

**`validateGroupDescription(description)`**

- Optional field
- Max 200 characters if provided

**`validateGroupMemberCount(memberIds)`**

- Minimum 3 members (including creator)
- Validates array of member IDs

#### Message Validation

**`validateMessageContent(content)`**

- Required field
- Max 2000 characters
- Prevents empty messages

**`sanitizeMessageContent(content)`**

- Removes script tags
- Removes event handlers
- Removes javascript: protocol
- Escapes HTML entities
- Prevents XSS attacks

#### User Profile Validation

**`validateDisplayName(displayName)`**

- Required field
- Max 50 characters
- Allows special characters (sanitized)

**`sanitizeDisplayName(displayName)`**

- Removes dangerous HTML/JS
- Preserves formatting characters
- Prevents XSS attacks

**`validateStatusMessage(statusMessage)`**

- Optional field
- Max 100 characters if provided

**`validateEmail(email)`**

- Required field
- Valid email format

**`validateUsername(username)`**

- Required field
- 3-20 characters
- Alphanumeric and underscores only

**`validatePassword(password)`**

- Required field
- Min 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

#### File Upload Validation

**`validateFileUpload(file, options)`**

- Checks file size (default max 5MB)
- Validates file type (default: images only)
- Configurable via options parameter

#### Search Validation

**`validateSearchQuery(query)`**

- Optional field
- Max 100 characters

**`sanitizeSearchQuery(query)`**

- Removes SQL injection patterns
- Trims whitespace
- Removes dangerous characters

#### Batch Validation

**`validateAll(validations)`**

- Validates multiple fields at once
- Returns all errors in a single object
- Useful for form validation

## Component Integration

### CreateGroupModal

- Validates group name and description
- Validates minimum member count
- Shows character counters
- Displays validation errors inline

### ChatWindow

- Validates message content before sending
- Shows error toast for invalid messages
- Prevents sending empty or oversized messages

### ProfileSetup

- Validates username, display name, and status message
- Validates file uploads (size and type)
- Shows validation errors inline
- Uses sanitization for display names

### RegisterForm

- Validates email format
- Enforces strong password requirements
- Validates password confirmation match

### GroupSettings

- Validates group name and description updates
- Prevents invalid group modifications
- Shows validation errors inline

## Error Messages

All error messages are:

- User-friendly and actionable
- Specific to the error context
- Displayed via toast notifications
- Dismissible by the user
- Timed appropriately (3-6 seconds)

## Retry Mechanism

Retryable errors (network, server) show a retry button that:

- Calls the original operation again
- Maintains the same parameters
- Provides immediate feedback
- Handles nested retries gracefully

## Security Features

### XSS Prevention

- All user input is sanitized before display
- HTML entities are escaped
- Script tags are removed
- Event handlers are stripped
- javascript: protocol is blocked

### SQL Injection Prevention

- Search queries are sanitized
- Special SQL characters are removed
- Parameterized queries used in backend (via Drizzle ORM)

### File Upload Security

- File size limits enforced
- File type validation
- Only images allowed for profile pictures

## Best Practices

1. **Always validate on both frontend and backend**

   - Frontend validation provides immediate feedback
   - Backend validation ensures security

2. **Use specific error types**

   - Helps with error tracking and debugging
   - Enables better user experience

3. **Provide retry options for transient errors**

   - Network errors
   - Server errors (500+)
   - Timeout errors

4. **Sanitize all user input**

   - Before storing
   - Before displaying
   - Before sending to backend

5. **Show appropriate error messages**
   - Don't expose internal errors to users
   - Provide actionable guidance
   - Use consistent language

## Testing Recommendations

1. Test validation with edge cases:

   - Empty strings
   - Maximum length strings
   - Special characters
   - Unicode characters
   - XSS attempts

2. Test error handling:

   - Network disconnection
   - Server errors
   - Permission errors
   - Invalid input

3. Test retry mechanism:
   - Successful retry
   - Failed retry
   - Multiple retries

## Future Enhancements

1. Add rate limiting feedback
2. Implement offline mode with queue
3. Add error reporting/logging service
4. Implement field-level validation hints
5. Add accessibility improvements for error messages
