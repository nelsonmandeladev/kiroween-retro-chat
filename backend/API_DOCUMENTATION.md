# RetroChat API Documentation

## Overview

This document provides information about the RetroChat API and its documentation.

## Swagger/OpenAPI Documentation

The API is fully documented using Swagger/OpenAPI specification. Once the server is running, you can access the interactive API documentation at:

```
http://localhost:3001/api/docs
```

## Features

### Request Validation

All API endpoints use `class-validator` for automatic request validation:

- **Type validation**: Ensures data types match the expected schema
- **Length constraints**: Validates string lengths (min/max)
- **Required fields**: Enforces required parameters
- **Whitelist**: Strips unknown properties from requests
- **Forbidden non-whitelisted**: Rejects requests with unexpected properties

### Response Schemas

All endpoints return properly typed responses with:

- Consistent data structures
- Proper HTTP status codes
- Detailed error messages
- Type-safe DTOs (Data Transfer Objects)

## API Endpoints

### Profile Management

#### GET /api/profile/:userId

Retrieve a user profile by user ID.
**Response**: `UserProfileResponseDto`

#### PATCH /api/profile

Update the authenticated user's profile (displayName, statusMessage).
**Request Body**: `UpdateProfileDto`
**Response**: `UserProfileResponseDto`

#### POST /api/profile/picture

Upload a profile picture for the authenticated user.
**Content-Type**: `multipart/form-data`
**Accepted formats**: JPEG, PNG, GIF, WebP
**Max file size**: 5MB
**Response**: `UploadProfilePictureResponseDto`

#### GET /api/users/search?q=query

Search for users by username or email.
**Query Parameters**: `q` (required): Search query string
**Response**: Array of `UserProfileResponseDto`

### Friend Management

#### POST /api/friends/request

Send a friend request to another user.
**Request Body**: `SendFriendRequestDto` (receiverId)
**Response**: `FriendRequestResponseDto`

#### GET /api/friends/requests

Get all pending friend requests for the authenticated user.
**Response**: Array of `FriendRequestResponseDto`

#### POST /api/friends/accept/:requestId

Accept a friend request.
**Response**: `FriendResponseDto`

#### POST /api/friends/reject/:requestId

Reject a friend request.
**Response**: Success message

#### GET /api/friends

Get all friends of the authenticated user.
**Response**: Array of `FriendResponseDto`

### Chat (1-on-1 Messaging)

#### POST /api/chat/send

Send a message to a friend.
**Request Body**: `SendMessageDto` (receiverId, content)
**Response**: `MessageResponseDto`

#### GET /api/chat/history/:friendId

Get chat history with a specific friend.
**Response**: Array of `MessageResponseDto`

#### GET /api/chat/unread

Get unread message counts for all conversations.
**Response**: `UnreadCountResponseDto`

#### POST /api/chat/mark-read/:friendId

Mark all messages from a friend as read.
**Response**: Success message

### AI Friend

#### POST /api/ai-friend/message

Send a message to your AI Friend.
**Request Body**: `SendAiMessageDto` (content)
**Response**: `AiMessageResponseDto` (streaming)

#### GET /api/ai-friend/profile

Get your AI Friend's style profile.
**Response**: `StyleProfileResponseDto`

#### POST /api/ai-friend/initialize

Initialize or reinitialize your AI Friend.
**Response**: Success message

### Group Chat

#### POST /api/groups

Create a new group.
**Request Body**: `CreateGroupDto` (name, description, memberIds)
**Response**: `GroupResponseDto`

#### GET /api/groups

Get all groups the user is a member of.
**Response**: Array of `GroupResponseDto`

#### GET /api/groups/:groupId

Get details of a specific group.
**Response**: `GroupResponseDto`

#### PATCH /api/groups/:groupId

Update group details (admin only).
**Request Body**: `UpdateGroupDto` (name, description, profilePictureUrl)
**Response**: `GroupResponseDto`

#### POST /api/groups/:groupId/members

Add a member to the group (admin only).
**Request Body**: `AddMemberDto` (userId)
**Response**: `GroupMemberResponseDto`

#### DELETE /api/groups/:groupId/members/:userId

Remove a member from the group (admin only).
**Response**: Success message

#### GET /api/groups/:groupId/members

Get all members of a group.
**Response**: Array of `GroupMemberResponseDto`

#### POST /api/groups/:groupId/messages

Send a message to a group.
**Request Body**: `SendGroupMessageDto` (content)
**Response**: `GroupMessageResponseDto`

#### GET /api/groups/:groupId/messages

Get message history for a group.
**Response**: Array of `GroupMessageResponseDto`

#### GET /api/groups/unread

Get unread message counts for all groups.
**Response**: `UnreadGroupCountResponseDto`

#### POST /api/groups/:groupId/mark-read

Mark all messages in a group as read.
**Response**: Success message

#### GET /api/groups/:groupId/ai-profile

Get the Group AI's style profile.
**Response**: Style profile data

### WebSocket Events

The WebSocket server (`/`) handles real-time events:

**Client → Server:**

- `join` - Join user's personal room
- `typing` - Notify typing status
- `stop-typing` - Stop typing notification

**Server → Client:**

- `message` - New 1-on-1 message received
- `group-message` - New group message received
- `friend-request` - New friend request received
- `friend-request-accepted` - Friend request was accepted
- `typing` - Friend is typing
- `stop-typing` - Friend stopped typing
- `user-status-change` - Friend's online status changed

## Data Transfer Objects (DTOs)

### Profile DTOs

**UpdateProfileDto**

```typescript
{
  displayName?: string;    // 1-100 characters
  statusMessage?: string;  // 0-200 characters
}
```

**UserProfileResponseDto**

```typescript
{
  id: string;
  name: string;
  email: string;
  username: string;
  displayName: string;
  statusMessage: string | null;
  profilePictureUrl: string | null;
}
```

**UploadProfilePictureResponseDto**

```typescript
{
  profilePictureUrl: string;
  message: string;
}
```

### Friend DTOs

**SendFriendRequestDto**

```typescript
{
  receiverId: string;
}
```

**FriendRequestResponseDto**

```typescript
{
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  sender: UserProfileResponseDto;
  receiver: UserProfileResponseDto;
}
```

**FriendResponseDto**

```typescript
{
  id: string;
  userId: string;
  friendId: string;
  createdAt: Date;
  friend: UserProfileResponseDto;
}
```

### Chat DTOs

**SendMessageDto**

```typescript
{
  receiverId: string;
  content: string; // 1-2000 characters
}
```

**MessageResponseDto**

```typescript
{
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender: UserProfileResponseDto;
}
```

**UnreadCountResponseDto**

```typescript
{
  [friendId: string]: number;
}
```

### AI Friend DTOs

**SendAiMessageDto**

```typescript
{
  content: string; // 1-2000 characters
}
```

**AiMessageResponseDto**

```typescript
{
  content: string;
  isStreaming: boolean;
}
```

**StyleProfileResponseDto**

```typescript
{
  userId: string;
  messageCount: number;
  avgMessageLength: number;
  commonWords: string[];
  emojiUsage: Record<string, number>;
  toneAnalysis: string;
  lastUpdated: Date;
}
```

### Group DTOs

**CreateGroupDto**

```typescript
{
  name: string;           // 1-100 characters
  description?: string;   // 0-500 characters
  memberIds: string[];    // Minimum 2 members
}
```

**UpdateGroupDto**

```typescript
{
  name?: string;
  description?: string;
  profilePictureUrl?: string;
}
```

**AddMemberDto**

```typescript
{
  userId: string;
}
```

**GroupResponseDto**

```typescript
{
  id: string;
  name: string;
  description: string | null;
  profilePictureUrl: string | null;
  createdById: string;
  createdAt: Date;
  members: GroupMemberResponseDto[];
}
```

**GroupMemberResponseDto**

```typescript
{
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  user: UserProfileResponseDto;
}
```

**SendGroupMessageDto**

```typescript
{
  content: string; // 1-2000 characters
}
```

**GroupMessageResponseDto**

```typescript
{
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: UserProfileResponseDto;
}
```

**UnreadGroupCountResponseDto**

```typescript
{
  [groupId: string]: number;
}
```

## Error Handling

The API returns standard HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors, missing parameters)
- **404**: Not Found (user or resource not found)
- **500**: Internal Server Error

Error responses include descriptive messages to help identify the issue.

## AI Features

### AI Friend Style Learning

The AI Friend analyzes user messages to build a personalized style profile:

1. **Message Collection**: Requires 50+ messages to activate learning
2. **Style Analysis**: Analyzes tone, vocabulary, emoji usage, message length
3. **Profile Building**: Creates a style profile stored in the database
4. **Response Generation**: Uses OpenAI GPT-4 to mimic user's style

**Style Profile Includes:**

- Average message length
- Common words and phrases
- Emoji usage patterns
- Tone analysis (casual, formal, enthusiastic, etc.)
- Vocabulary preferences

### Group AI

Group AI learns from all members of a group:

1. **Collective Learning**: Analyzes messages from all group members
2. **Group Dynamics**: Adapts to the group's collective style
3. **Mention Responses**: Responds when mentioned with `@GroupAI`
4. **Context Awareness**: Considers recent conversation context

### Streaming Responses

AI responses use Server-Sent Events (SSE) for streaming:

```typescript
// Client receives chunks as they're generated
const response = await fetch('/api/ai-friend/message', {
  method: 'POST',
  body: JSON.stringify({ content: 'Hello!' }),
});

const reader = response.body.getReader();
// Read stream chunks...
```

## Authentication

Endpoints that require authentication use Better-auth session management. The user ID is extracted from the session and used to authorize operations.

**Protected Endpoints**: All endpoints except `/api/auth/*` require authentication.

## Development

To start the development server with API documentation:

```bash
npm run start:dev
```

Then visit `http://localhost:3001/api/docs` to explore the API interactively.
