# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Initialize Next.js frontend with React 19 and TypeScript in `/frontend` directory
  - Initialize NestJS backend with TypeScript in `/backend` directory
  - Install and configure Tailwind CSS for frontend
  - Install Zustand for state management
  - Install Socket.io-client for frontend WebSocket
  - Install Socket.io for backend WebSocket server
  - Install Drizzle ORM and Neon PostgreSQL client
  - Install Better-auth and NestJS Better-auth adapter
  - Install Upstash Redis client
  - Install Cloudinary SDK
  - Install OpenAI SDK
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Configure database and authentication

  - [x] 2.1 Set up Drizzle ORM configuration with Neon PostgreSQL

    - Create Drizzle config file pointing to Neon database
    - Set up database connection in backend
    - _Requirements: 1.1, 1.2, 1.3, 7.2, 7.3_

  - [x] 2.2 Create Better-auth required schemas

    - Define user, session, account, and verification tables using Drizzle schema
    - Create userProfile table for RetroChat-specific user data (username, displayName, statusMessage, profilePictureUrl)
    - _Requirements: 1.1, 1.2, 1.3, 7.2_

  - [x] 2.3 Create RetroChat-specific database schemas

    - Define messages table with fromUserId, toUserId, content, timestamp, isRead, isAIGenerated
    - Define friendships table with userId1, userId2, createdAt
    - Define friendRequests table with fromUserId, toUserId, status, createdAt
    - Define styleProfiles table with userId, messageCount, commonPhrases, emojiUsage, averageMessageLength, toneIndicators, stylePrompt
    - Add appropriate indexes for performance
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.4 Run database migrations

    - Generate and execute Drizzle migrations to create all tables
    - _Requirements: All requirements depend on database setup_

  - [x] 2.5 Configure Better-auth with Drizzle adapter
    - Create auth server config with Drizzle adapter pointing to Neon database
    - Set up AuthModule in NestJS AppModule
    - Configure Better-auth for email/password authentication
    - _Requirements: 1.1, 1.2, 1.3, 7.2, 7.3, 7.4_

- [x] 3. Implement user profile management

  - [x] 3.1 Create user profile service in backend

    - Implement getUserProfile to fetch user and userProfile data
    - Implement updateProfile to update displayName, statusMessage
    - Implement searchUsers to find users by username or email
    - _Requirements: 1.4, 1.5, 2.1, 6.5_

  - [x] 3.2 Create Cloudinary integration for profile pictures

    - Set up Cloudinary configuration with API credentials
    - Implement uploadProfilePicture endpoint that uploads to Cloudinary and updates userProfile
    - _Requirements: 1.5_

  - [x] 3.3 Create profile API endpoints
    - GET /api/profile/:userId - Get user profile
    - PATCH /api/profile - Update current user's profile
    - POST /api/profile/picture - Upload profile picture
    - GET /api/users/search?q=query - Search users
    - _Requirements: 1.4, 1.5, 2.1_

- [x] 4. Implement friend management system

  - [x] 4.1 Create friend service in backend

    - Implement sendFriendRequest to create pending friend request
    - Implement acceptFriendRequest to create friendship and update request status
    - Implement rejectFriendRequest to update request status
    - Implement getFriendRequests to fetch pending requests for a user
    - Implement getFriends to fetch all friendships for a user
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.2 Create friend management API endpoints

    - POST /api/friends/request - Send friend request
    - POST /api/friends/accept/:requestId - Accept friend request
    - POST /api/friends/reject/:requestId - Reject friend request
    - GET /api/friends/requests - Get pending friend requests
    - GET /api/friends - Get user's friends list
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.3 Implement WebSocket notifications for friend requests
    - Emit 'friend:request' event when new friend request is sent
    - Emit 'friend:accepted' event when friend request is accepted
    - _Requirements: 2.2_

- [x] 5. Implement real-time messaging system

  - [x] 5.1 Create chat service in backend

    - Implement sendMessage to store message in database
    - Implement getConversation to fetch message history between two users
    - Implement markAsRead to update message read status
    - Implement getUnreadCount to count unread messages for a user
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 5.2 Set up Socket.io WebSocket server in NestJS

    - Create WebSocket gateway with Socket.io
    - Implement connection handling with Better-auth session validation
    - Store user socket connections in Upstash Redis for online status tracking
    - _Requirements: 2.4, 2.5, 3.2_

  - [x] 5.3 Implement WebSocket message events

    - Handle 'message:send' event to save message and emit to recipient
    - Emit 'message:receive' event to deliver messages to online users
    - Handle 'user:typing' event and broadcast to recipient
    - Emit 'user:status' event when users connect/disconnect
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 5.4 Create chat API endpoints
    - GET /api/messages/:userId - Get conversation with specific user
    - POST /api/messages/read/:messageId - Mark message as read
    - GET /api/messages/unread - Get unread message count
    - _Requirements: 3.3, 3.5_

- [x] 6. Implement AI Friend style analysis

  - [x] 6.1 Create AI style analysis service

    - Implement analyzeMessages to extract chat patterns from user messages
    - Calculate common phrases using frequency analysis
    - Detect emoji usage patterns
    - Calculate average message length
    - Analyze tone indicators (casual, formal, enthusiastic) using basic sentiment analysis
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.2 Implement style profile management

    - Create updateStyleProfile to update profile after every 10 messages
    - Implement getStyleProfile to fetch user's current style profile
    - Implement resetStyleProfile to clear learned style data
    - Generate stylePrompt text from analyzed patterns for LLM
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [x] 6.3 Create AI Friend response generation

    - Implement generateAIResponse using OpenAI API
    - Check if user has minimum 50 messages before generating styled responses
    - Return learning message if insufficient data
    - Use stylePrompt to instruct LLM to mimic user's chat style
    - Store AI-generated messages with isAIGenerated flag
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.4 Create AI Friend API endpoints

    - POST /api/ai-friend/message - Send message to AI Friend and get response
    - GET /api/ai-friend/profile - Get AI Friend's learned style profile
    - POST /api/ai-friend/reset - Reset AI Friend's learned style
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.5 Integrate AI Friend with messaging system
    - Create special AI Friend contact for each user
    - Route AI Friend messages through AI service instead of WebSocket
    - Trigger style profile updates when user sends messages
    - _Requirements: 4.1, 4.4, 5.1, 5.2_

- [ ] 7. Build frontend authentication UI

  - [ ] 7.1 Set up Better-auth client in Next.js

    - Install and configure Better-auth client
    - Create auth API route handlers in Next.js
    - Set up auth context/hooks for frontend
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 7.2 Create login and registration pages

    - Build LoginForm component with email and password fields
    - Build RegisterForm component with username, email, and password fields
    - Implement form validation
    - Connect forms to Better-auth client methods
    - Add error handling and display
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 7.3 Create profile setup page

    - Build ProfileSetup component for initial profile configuration
    - Add display name input
    - Add status message input
    - Add profile picture upload with Cloudinary
    - Show after successful registration
    - _Requirements: 1.4, 1.5_

  - [ ] 7.4 Implement authentication state management
    - Create Zustand store for auth state (user, isAuthenticated, loading)
    - Implement login, logout, and session check actions
    - Add protected route wrapper component
    - _Requirements: 1.1, 1.2, 1.3, 7.4_

- [ ] 8. Build frontend contact list and friend management

  - [ ] 8.1 Create contact list component

    - Build ContactList component displaying friends with online status
    - Show status indicators (green for online, orange for away, red for offline)
    - Display user profile pictures and display names
    - Add AI Friend as special contact at top of list
    - Implement click handler to open chat window
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 5.1, 6.1_

  - [ ] 8.2 Create friend search and request UI

    - Build UserSearch component with search input
    - Display search results with "Add Friend" button
    - Build FriendRequests component showing pending requests
    - Add accept/reject buttons for incoming requests
    - Show sent requests with pending status
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 8.3 Implement WebSocket connection for real-time status

    - Set up Socket.io client connection with Better-auth token
    - Listen for 'user:status' events to update contact online status
    - Listen for 'friend:request' events to show new friend requests
    - Emit 'user:online' event on connection
    - Handle reconnection with exponential backoff
    - _Requirements: 2.2, 2.4, 2.5_

  - [ ] 8.4 Create contact list state management
    - Create Zustand store for contacts (friends, onlineStatus, friendRequests)
    - Implement actions to fetch friends, send requests, accept/reject requests
    - Update online status from WebSocket events
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 9. Build frontend chat interface

  - [ ] 9.1 Create chat window component

    - Build ChatWindow component with retro MSN Messenger styling
    - Display contact name and status at top
    - Show message history with timestamps (HH:MM format)
    - Differentiate sent vs received messages with alignment
    - Add message input field at bottom
    - Style with Tailwind CSS to match MSN Messenger aesthetic
    - _Requirements: 3.1, 3.3, 6.2_

  - [ ] 9.2 Implement message sending and receiving

    - Connect message input to WebSocket 'message:send' event
    - Listen for 'message:receive' events to display new messages
    - Show typing indicator when 'user:typing' event received
    - Emit 'user:typing' event when user types
    - Auto-scroll to bottom when new messages arrive
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 9.3 Add emoticon support

    - Create EmoticonPicker component with classic MSN emoticons
    - Convert text emoticons to emoji/images in messages
    - Add emoticon button to message input
    - _Requirements: 6.3_

  - [ ] 9.4 Implement message history loading

    - Fetch conversation history when opening chat window
    - Display loading state while fetching
    - Implement pagination for older messages
    - Mark messages as read when chat window is open
    - _Requirements: 3.3, 3.5_

  - [ ] 9.5 Create chat state management
    - Create Zustand store for chat (activeChat, conversations, typingUsers)
    - Implement actions to send messages, load history, mark as read
    - Store messages by conversation for quick access
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 10. Implement AI Friend chat interface

  - [ ] 10.1 Create AI Friend chat window

    - Reuse ChatWindow component for AI Friend
    - Add visual indicator that chat is with AI Friend
    - Show learning status message when messageCount < 50
    - Display AI-generated messages with subtle indicator
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 10.2 Implement AI Friend messaging

    - Send messages to AI Friend API endpoint instead of WebSocket
    - Display loading indicator while AI generates response
    - Handle AI response and display in chat
    - Show error message if AI service fails
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 10.3 Add AI Friend profile management UI
    - Create button to view AI Friend's learned style profile
    - Display style characteristics (common phrases, emoji usage, tone)
    - Add reset button to clear learned style
    - Show confirmation dialog before reset
    - _Requirements: 5.4, 5.5_

- [ ] 11. Add retro MSN Messenger styling and features

  - [ ] 11.1 Implement retro UI theme

    - Create Tailwind CSS custom theme matching MSN Messenger colors
    - Style contact list with classic MSN layout
    - Style chat windows with MSN-style borders and headers
    - Add MSN-style buttons and inputs
    - _Requirements: 6.1, 6.2_

  - [ ] 11.2 Add notification sounds

    - Create NotificationSound component
    - Play sound when receiving new messages
    - Play sound for friend requests
    - Add user setting to enable/disable sounds
    - _Requirements: 6.4_

  - [ ] 11.3 Implement custom display names
    - Allow users to format display names with special characters
    - Display formatted names in contact list and chat windows
    - Sanitize display names to prevent XSS
    - _Requirements: 6.5_

- [ ] 12. Implement error handling and edge cases

  - [ ] 12.1 Add frontend error handling

    - Create toast notification component for errors
    - Handle network errors with retry button
    - Handle WebSocket disconnection with reconnection logic
    - Display user-friendly error messages
    - _Requirements: All requirements benefit from error handling_

  - [ ] 12.2 Add backend error handling

    - Implement global exception filter in NestJS
    - Return consistent error response format
    - Log errors for monitoring
    - Handle AI API failures with fallback responses
    - Implement rate limiting middleware
    - _Requirements: All requirements benefit from error handling_

  - [ ] 12.3 Add input validation
    - Validate all user inputs on frontend
    - Validate all API inputs on backend using DTOs
    - Sanitize message content to prevent XSS
    - Validate file uploads (size, type)
    - _Requirements: 7.4_

- [ ] 13. Set up environment configuration and deployment

  - [ ] 13.1 Configure environment variables

    - Create .env.example files for frontend and backend
    - Document required environment variables (database URL, Redis URL, OpenAI API key, Cloudinary credentials)
    - Set up environment variables in Vercel dashboard
    - _Requirements: All requirements depend on proper configuration_

  - [ ] 13.2 Prepare for Vercel deployment

    - Configure vercel.json for backend serverless functions
    - Configure next.config.js for frontend
    - Set up build scripts in package.json
    - Test local builds
    - _Requirements: All requirements depend on deployment_

  - [ ] 13.3 Deploy to Vercel
    - Deploy frontend Next.js app to Vercel
    - Deploy backend NestJS app to Vercel
    - Configure custom domains if needed
    - Verify WebSocket connections work in production
    - Test end-to-end functionality in production
    - _Requirements: All requirements must work in production_
