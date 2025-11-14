# RetroChat Frontend

A Next.js 16 application with React 19 that recreates the nostalgic MSN Messenger experience with modern AI-powered features.

## Features

- **Landing Page**: Nostalgic MSN Messenger-inspired welcome experience
  - Animated retro windows with fade-in effects
  - Feature showcase grid (Real-Time Chat, AI Friend, Group Chats)
  - Interactive demo chat window
  - Status indicators and typing animations
  - Responsive design with gradient background
- **Retro UI**: Authentic MSN Messenger aesthetic with Tailwind CSS
- **Real-time Chat**: WebSocket-powered messaging with typing indicators
- **AI Integration**: Personal AI Friend and Group AI features
- **State Management**: Zustand stores for auth, chat, contacts, and groups
- **Authentication**: Better-auth with protected routes
- **File Uploads**: Cloudinary integration for profile pictures
- **Notifications**: Toast notifications and sound effects

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Socket.io-client (WebSocket)
- Better-auth (authentication)
- Cloudinary (file uploads)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# WebSocket URL (usually same as API URL)
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Better-auth configuration (must match backend)
BETTER_AUTH_SECRET=your-secret-key-must-match-backend
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...  # Same as backend

# Optional
NODE_ENV=development
```

**Important**: The `BETTER_AUTH_SECRET` and `DATABASE_URL` must be identical to the backend configuration for authentication to work properly.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page with retro MSN design
│   ├── chat/              # Main chat interface
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── profile-setup/     # Profile setup page
├── components/
│   ├── auth/              # Authentication components
│   ├── chat/              # Chat UI components
│   ├── retroui/           # Retro-styled UI components
│   └── ui/                # Utility UI components
├── lib/
│   ├── api/               # API client and services
│   ├── stores/            # Zustand state stores
│   ├── utils/             # Utility functions
│   └── websocket/         # WebSocket service
└── public/
    └── sounds/            # Notification sound effects
```

## Authentication

The frontend uses Better-auth React client with a proxy architecture and middleware-based protection:

1. **Better-auth Client**: Configured in `lib/auth-client.ts` to communicate with backend
2. **API Route Proxy**: `/api/auth/[...all]` proxies all auth requests to backend
3. **Session Management**: Better-auth handles session cookies and validation
4. **Middleware Protection**: `middleware.ts` checks for session cookie on protected routes (`/chat`, `/profile-setup`)
5. **Client-Side Session**: Components use `useSession()` hook to access user data

### Authentication Flow

```typescript
// User logs in
await signIn.email({
  email: "user@example.com",
  password: "password",
});

// Request flows:
// 1. Frontend → /api/auth/sign-in/email (Next.js API route)
// 2. Next.js → Backend /api/auth/sign-in/email
// 3. Backend processes auth and sets cookies
// 4. Response with session data flows back

// Protected route access:
// 1. User navigates to /chat
// 2. Middleware checks for session cookie
// 3. If no cookie → redirect to /login
// 4. If cookie exists → allow access
// 5. Component uses useSession() to get user data
```

## Key Components

### Pages

- **Landing Page** (`app/page.tsx`): Retro MSN Messenger-inspired welcome page with:
  - Hero section with animated window
  - Feature showcase grid
  - Demo chat window with typing indicators
  - Call-to-action buttons
  - Responsive design with gradient background

### Chat Components

- **ChatWindow**: Main chat interface with message history
- **ContactList**: Friends and groups list with status indicators
- **AIFriendProfile**: AI Friend style profile viewer
- **GroupSettings**: Group management and member controls
- **CreateGroupModal**: Group creation with member selection
- **FriendRequests**: Friend request management
- **NotificationBanner**: Real-time notification system

## State Management

The application uses Zustand for global state management:

- **auth-store**: User authentication and session
- **chat-store**: 1-on-1 messages and chat state
- **contact-store**: Friends list and online status
- **group-store**: Group chats and members
- **notification-store**: Toast notifications and settings

## WebSocket Integration

Real-time features use Socket.io:

```typescript
// Connect to WebSocket server
const socket = io(NEXT_PUBLIC_WS_URL);

// Listen for events
socket.on("message", handleNewMessage);
socket.on("typing", handleTyping);
socket.on("user-status-change", handleStatusChange);

// Emit events
socket.emit("typing", { receiverId, isTyping: true });
```

**Auto-reconnection**: The WebSocket client automatically reconnects on disconnection with exponential backoff.

## Error Handling

Centralized error handling via `lib/utils/error-handler.ts`:

- Network errors: Show retry button
- Auth errors: Redirect to login
- Validation errors: Display inline
- WebSocket errors: Auto-reconnect
- AI errors: Allow manual retry

## Styling

Retro MSN Messenger theme using Tailwind CSS:

**Color Palette:**

- Primary Blue: `#0066CC`
- Window Gray: `#ECE9D8`
- Border Blue: `#0054A6`
- Status Green: `#7FBA00`
- Status Away: `#FFC40D`
- Gradient Background: `from-[#5b9bd5] via-[#4d94ff] to-[#0066cc]`

**Custom Classes:**

- `.msn-window`: MSN-style window container with header and body
- `.msn-window-header`: Window title bar with gradient
- `.msn-window-body`: Window content area
- `.msn-button`: Classic button styling
- `.msn-button-primary`: Primary action button
- `.msn-input`: Input field styling
- `.msn-panel`: Content panel with border
- `.msn-divider`: Horizontal divider line
- `.msn-status-online`: Green online indicator
- `.msn-status-away`: Yellow away indicator
- `.msn-message-sent`: Sent message bubble
- `.msn-message-received`: Received message bubble
- `.msn-message-ai`: AI message bubble (purple theme)
- `.msn-typing`: Typing indicator with animated dots

**Animations:**

- `fadeIn`: Smooth fade-in effect for page elements
- `typing-dots`: Animated typing indicator dots
- `message-bubble-enter`: Message appearance animation

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://zustand-demo.pmnd.rs)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

## Deployment

This frontend is part of a monorepo structure. For deployment instructions, see [DEPLOYMENT_SETUP.md](../DEPLOYMENT_SETUP.md) in the root directory.

### Quick Deployment on Vercel

The frontend is deployed from a separate `retrochat-frontend` repository that's synced from the monorepo using git subtree.

**Vercel Configuration:**

- Framework: Next.js
- Root directory: `/`
- Build command: `npm run build`
- Output directory: `.next`

**Required Environment Variables:**

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL
- `BETTER_AUTH_SECRET` - Authentication secret (must match backend)
- `BETTER_AUTH_URL` - Frontend URL
- `DATABASE_URL` - PostgreSQL connection string (for Better-auth)

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
