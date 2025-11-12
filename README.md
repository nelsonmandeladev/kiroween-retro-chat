# RetroChat

A nostalgic chat application inspired by MSN Messenger with AI-powered chat style mimicry.

## Project Structure

```
retro-chat/
├── frontend/          # Next.js 16 + React 19 frontend
├── backend/           # NestJS backend with WebSocket support
└── .kiro/specs/       # Feature specifications and implementation plan
```

## Technology Stack

### Frontend

- **Framework**: Next.js 16 with React 19 and TypeScript
- **Styling**: Tailwind CSS (retro MSN Messenger theme)
- **State Management**: Zustand
- **Real-time**: Socket.io-client
- **Authentication**: Better-auth
- **File Storage**: Cloudinary
- **AI Integration**: OpenAI SDK

### Backend

- **Framework**: NestJS with TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Real-time**: Socket.io WebSocket server
- **Authentication**: Better-auth with Drizzle adapter
- **Cache/Sessions**: Upstash Redis
- **File Storage**: Cloudinary
- **AI Integration**: OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+ (currently using v23.5.0)
- npm or yarn
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)
- Cloudinary account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Configuration

1. Copy the example environment files:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

2. Fill in the required environment variables in both `.env` files

### Running the Application

#### Development Mode

```bash
# Start backend (from backend directory)
npm run start:dev

# Start frontend (from frontend directory)
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3001`.

### Database Setup

```bash
# Navigate to backend directory
cd backend

# Generate Drizzle migration
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Drizzle Studio to view database
npm run db:studio
```

### Testing the Application

1. Register a new account at `/register`
2. Complete profile setup at `/profile-setup`
3. Search for users and send friend requests
4. Start chatting with friends in real-time
5. Send 50+ messages to activate AI Friend learning
6. Create a group chat with multiple friends
7. Mention the Group AI with `@GroupAI` in group chats

## Deployment

This project uses a monorepo structure with separate deployment repositories for frontend and backend. See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for detailed deployment instructions.

### Initial Setup

Run the initialization script to set up the monorepo:

```bash
./init-monorepo.sh
```

This will remove nested git repos, initialize the monorepo, and guide you through the setup process.

### Quick Deployment Overview

**Frontend (Vercel)**

- Deploy from `retrochat-frontend` repository
- Framework: Next.js
- Build command: `npm run build`

**Backend (Railway/Render)**

- Deploy from `retrochat-backend` repository
- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`

### Required Services

- **Database**: Neon PostgreSQL (free tier available)
- **Cache**: Upstash Redis (free tier available)
- **Storage**: Cloudinary (free tier available)
- **AI**: OpenAI API (pay-per-use)

### Syncing Deployments

After making changes to the monorepo, sync to deployment repositories:

```bash
./sync-deployments.sh
```

See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for complete setup instructions.

## Features

### Core Features

- User authentication and profile management
- Real-time 1-on-1 messaging with friends
- Friend request system with accept/reject
- Online status indicators and typing indicators
- Profile picture uploads via Cloudinary
- Custom emoticons and notification sounds
- Retro MSN Messenger UI/UX

### AI-Powered Features

- **AI Friend**: Personal AI that learns and mimics your chat style
  - Analyzes 50+ messages to build style profile
  - Adapts tone, vocabulary, and emoji usage
  - Responds when you're offline
- **Group AI**: Collective AI for group chats
  - Learns from all group members
  - Responds to @mentions
  - Adapts to group dynamics

### Group Chat

- Create and manage group chats
- Add/remove members (admin only)
- Group profile pictures and descriptions
- Real-time group messaging
- Unread message counters

## Architecture

### Frontend Architecture

- **App Router**: Next.js 16 with React 19 Server Components
- **State Management**: Zustand stores (auth, chat, contacts, groups, notifications)
- **Real-time**: Socket.io-client with automatic reconnection
- **Styling**: Tailwind CSS with custom retro MSN theme
- **API Client**: Type-safe API services with centralized error handling

### Backend Architecture

- **Framework**: NestJS with modular architecture
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Real-time**: Socket.io WebSocket server with Redis adapter
- **Authentication**: Better-auth with session-based auth
- **File Storage**: Cloudinary for profile pictures
- **AI Integration**: OpenAI GPT-4 for style analysis and generation

### Data Flow

1. User actions trigger API calls via service layer
2. Backend validates, processes, and stores data
3. WebSocket events notify connected clients in real-time
4. Zustand stores update, triggering React re-renders
5. AI services analyze messages and generate responses

## Development

### Project Structure

```
.kiro/
├── specs/              # Feature specifications
│   ├── retro-chat/    # Core chat features
│   ├── group-chat/    # Group chat features
│   └── frontend-tasks.md
├── steering/           # Code consistency guidelines
│   ├── react-patterns.md
│   ├── retro-ui-guidelines.md
│   └── error-handling-standards.md
└── hooks/              # Agent automation hooks
```

See `.kiro/specs/` for detailed requirements, design, and implementation tasks.

## Kiroween 2025 Hackathon

This project was built for the Kiroween 2025 Hackathon using Kiro's AI-powered development tools.

### Kiro Features Used:

- **Spec-Driven Development**: Comprehensive requirements, design, and task documents
- **Vibe Coding**: AI-assisted component and feature generation
- **Steering Documents**: Code consistency and quality guidelines
- **Agent Hooks**: Automated validation and quality checks

See [KIRO_USAGE.md](./KIRO_USAGE.md) for detailed documentation on how we used Kiro to build this project.

### Hackathon Category:

**Resurrection** - Bringing back MSN Messenger nostalgia with modern AI and real-time chat technology.

## Troubleshooting

### WebSocket Connection Issues

- Ensure backend is running on the correct port (3001)
- Check CORS settings in backend `.env`
- Verify `FRONTEND_URL` matches your frontend URL

### Database Connection Errors

- Verify `DATABASE_URL` is correct in backend `.env`
- Run migrations: `npm run db:migrate`
- Check Neon dashboard for connection issues

### AI Friend Not Learning

- Ensure OpenAI API key is valid
- Send at least 50 messages to activate learning
- Check backend logs for AI service errors

### Profile Picture Upload Fails

- Verify Cloudinary credentials in `.env`
- Check file size (max 5MB)
- Ensure file format is supported (JPEG, PNG, GIF, WebP)

### Authentication Issues

- Clear browser cookies and local storage
- Verify `BETTER_AUTH_SECRET` matches in both frontend and backend
- Check Redis connection for session storage

## Documentation

- **[DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)** - Monorepo deployment guide
- **[KIRO_USAGE.md](./KIRO_USAGE.md)** - How we used Kiro to build this project
- **[HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md)** - Hackathon submission checklist
- **[Backend README](./backend/README.md)** - Backend setup and architecture
- **[Frontend README](./frontend/README.md)** - Frontend setup and architecture
- **[API Documentation](./backend/API_DOCUMENTATION.md)** - Complete API reference
- **[AI Friend Streaming](./backend/docs/ai-friend-streaming.md)** - WebSocket streaming implementation

## Contributing

This project was built for the Kiroween 2025 Hackathon. Contributions are welcome after the hackathon period.

## License

MIT License - See LICENSE file for details
