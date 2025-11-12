# API Services

This directory contains centralized API services for making HTTP requests to the backend.

## Structure

- `client.ts` - Base API client with common HTTP methods (GET, POST, PATCH, DELETE, file upload)
- `types.ts` - TypeScript type definitions for API requests and responses
- `*.service.ts` - Domain-specific service modules

## Services

### Profile Service (`profile.service.ts`)

- `getUserProfile(userId)` - Get user profile by ID
- `updateProfile(data)` - Update current user's profile
- `uploadProfilePicture(file)` - Upload profile picture
- `searchUsers(query)` - Search users by username or email

### Friends Service (`friends.service.ts`)

- `sendFriendRequest(data)` - Send a friend request
- `acceptFriendRequest(requestId)` - Accept a friend request
- `rejectFriendRequest(requestId)` - Reject a friend request
- `getPendingRequests()` - Get pending friend requests
- `getFriends()` - Get friends list

### Chat Service (`chat.service.ts`)

- `getUnreadCount()` - Get unread message count
- `getConversation(userId, limit)` - Get conversation with a user
- `markAsRead(messageId)` - Mark a message as read

### AI Friend Service (`ai-friend.service.ts`)

- `sendMessage(data)` - Send message to AI Friend
- `getStyleProfile()` - Get AI Friend's learned style profile
- `resetStyle()` - Reset AI Friend's learned style

### Groups Service (`groups.service.ts`)

- `createGroup(data)` - Create a new group
- `getGroups()` - Get user's groups
- `getUnreadCount()` - Get unread group message count
- `getGroup(groupId)` - Get group details
- `updateGroup(groupId, data)` - Update group
- `deleteGroup(groupId)` - Delete group
- `addMember(groupId, data)` - Add member to group
- `removeMember(groupId, userId)` - Remove member from group
- `leaveGroup(groupId)` - Leave group
- `getMembers(groupId)` - Get group members
- `getMessages(groupId, limit, before)` - Get group messages
- `markMessagesAsRead(groupId, messageIds)` - Mark messages as read
- `getAIProfile(groupId)` - Get group AI style profile
- `resetAIStyle(groupId)` - Reset group AI style
- `toggleAI(groupId, enabled)` - Enable/disable group AI

## Usage

```typescript
import { profileService, friendsService } from "@/lib/api";

// Get user profile
const profile = await profileService.getUserProfile(userId);

// Update profile
await profileService.updateProfile({
  displayName: "John Doe",
  statusMessage: "Hello world!",
});

// Upload profile picture
await profileService.uploadProfilePicture(file);

// Send friend request
await friendsService.sendFriendRequest({ toUserId: "user123" });
```

## Features

- **Centralized error handling** - All API errors are caught and thrown with meaningful messages
- **Type safety** - Full TypeScript support with request/response types
- **Automatic authentication** - Credentials are included in all requests
- **Query parameters** - Easy-to-use params object for GET requests
- **File uploads** - Dedicated method for multipart/form-data uploads
- **Consistent API** - All services follow the same patterns

## Backend Endpoints

All services proxy to the backend API at `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`).

## Notes

- The API client automatically includes credentials (cookies) for authentication
- All requests use JSON content type by default (except file uploads)
- Error responses are automatically parsed and thrown as Error objects
- The base URL is configured via the `NEXT_PUBLIC_API_URL` environment variable
