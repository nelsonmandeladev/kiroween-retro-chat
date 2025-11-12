# RetroChat Frontend

A Next.js 16 application with React 19 that recreates the nostalgic MSN Messenger experience with modern AI-powered features.

## Features

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
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

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

## Key Components

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

**Custom Classes:**

- `.retro-window`: MSN-style window container
- `.retro-button`: Classic button styling
- `.retro-input`: Input field styling
- `.status-indicator`: Online/offline/away indicators

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
