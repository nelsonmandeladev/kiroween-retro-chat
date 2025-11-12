# Frontend Implementation Plan (Unified)

This plan combines frontend tasks from both retro-chat and group-chat specs into a unified workflow that builds shared components first, then extends them for specific features.

## Phase 1: Foundation & Authentication

- [x] 1. Set up authentication and core infrastructure

  - [x] 1.1 Set up Better-auth client in Next.js

    - Install and configure Better-auth client
    - Create auth API route handlers in Next.js
    - Set up auth context/hooks for frontend
    - _Source: retro-chat task 7.1_

  - [x] 1.2 Create login and registration pages

    - Build LoginForm component with email and password fields
    - Build RegisterForm component with username, email, and password fields
    - Implement form validation
    - Connect forms to Better-auth client methods
    - Add error handling and display
    - _Source: retro-chat task 7.2_

  - [x] 1.3 Create profile setup page

    - Build ProfileSetup component for initial profile configuration
    - Add display name input
    - Add status message input
    - Add profile picture upload with Cloudinary
    - Show after successful registration
    - _Source: retro-chat task 7.3_

  - [x] 1.4 Implement authentication state management
    - Create Zustand store for auth state (user, isAuthenticated, loading)
    - Implement login, logout, and session check actions
    - Add protected route wrapper component
    - _Source: retro-chat task 7.4_

## Phase 2: Core State Management & WebSocket

- [x] 2. Set up global state management and real-time connections

  - [x] 2.1 Create unified chat state management

    - Create Zustand store for chat (activeChat, conversations, typingUsers)
    - Support both 1-on-1 and group conversations
    - Implement actions to send messages, load history, mark as read
    - Store messages by conversation for quick access
    - _Source: retro-chat task 9.5, group-chat task 9_

  - [x] 2.2 Create contact and group state management

    - Create Zustand store for contacts (friends, onlineStatus, friendRequests)
    - Create Zustand store for groups (userGroups, activeGroup, groupMembers)
    - Implement actions to fetch friends, send requests, accept/reject requests
    - Implement actions to fetch groups, create group, update group
    - Track unread counts per contact and per group
    - _Source: retro-chat task 8.4, group-chat task 9.1_

  - [x] 2.3 Set up WebSocket connection
    - Set up Socket.io client connection with Better-auth token
    - Listen for 'user:status' events to update contact online status
    - Listen for 'friend:request' events to show new friend requests
    - Listen for group-related events (messages, members, AI)
    - Handle reconnection with exponential backoff
    - Update state stores from WebSocket events
    - _Source: retro-chat task 8.3, group-chat task 9.2_

## Phase 3: Contact List & Friend Management

- [x] 3. Build contact list and friend management UI

  - [x] 3.1 Create unified contact list component

    - Build ContactList component displaying friends and groups
    - Show status indicators (green for online, orange for away, red for offline)
    - Display user profile pictures and display names
    - Add AI Friend as special contact at top of list
    - Show group chats with member count and unread badge
    - Implement click handler to open chat window
    - Style with retro MSN Messenger aesthetic
    - _Source: retro-chat task 8.1, group-chat task 5.2_

  - [x] 3.2 Create friend search and request UI

    - Build UserSearch component with search input
    - Display search results with "Add Friend" button
    - Build FriendRequests component showing pending requests
    - Add accept/reject buttons for incoming requests
    - Show sent requests with pending status
    - _Source: retro-chat task 8.2_

  - [x] 3.3 Create group creation interface

    - Build CreateGroupModal component with name and description inputs
    - Add friend selector to choose initial members
    - Implement form validation (name required, min 3 members)
    - Connect to group creation API
    - Show success message and navigate to new group chat
    - _Source: group-chat task 5.1_

  - [x] 3.4 Create group settings interface

    - Build GroupSettings component for admins
    - Add inputs to edit group name and description
    - Show member list with remove buttons (admin only)
    - Add "Add Member" button to invite friends
    - Add "Leave Group" button for all members
    - Add "Delete Group" button for admins with confirmation
    - _Source: group-chat task 5.3_

  - [x] 3.5 Create group member list component
    - Build GroupMemberList showing all members with avatars
    - Display online status indicators
    - Show admin badges
    - Display Group AI Member with special styling
    - Show member count in header
    - _Source: group-chat task 5.4_

## Phase 4: Core Chat Interface (Shared Components)

- [x] 4. Build shared chat window components

  - [x] 4.1 Create base chat window component

    - Build ChatWindow component with retro MSN Messenger styling
    - Display contact/group name and status at top
    - Show message history with timestamps (HH:MM format)
    - Differentiate sent vs received messages with alignment
    - Add message input field at bottom
    - Style with Tailwind CSS to match MSN Messenger aesthetic
    - Support both 1-on-1 and group chat modes
    - _Source: retro-chat task 9.1, group-chat task 6.1_

  - [x] 4.2 Implement message sending and receiving

    - Connect message input to WebSocket events ('message:send' or 'group:message:send')
    - Listen for message receive events
    - Show typing indicator when 'user:typing' or 'group:typing' event received
    - Emit typing events when user types
    - Auto-scroll to bottom when new messages arrive
    - Handle both 1-on-1 and group message formats
    - _Source: retro-chat task 9.2, group-chat task 6.2_

  - [x] 4.3 Implement message history loading

    - Fetch conversation history when opening chat window
    - Display loading state while fetching
    - Implement infinite scroll for older messages
    - Mark messages as read when chat window is open
    - Support both 1-on-1 and group message history
    - _Source: retro-chat task 9.4, group-chat task 6.3_

  - [x] 4.4 Add emoticon support
    - Create EmoticonPicker component with classic MSN emoticons
    - Convert text emoticons to emoji/images in messages
    - Add emoticon button to message input
    - _Source: retro-chat task 9.3_

## Phase 5: Group-Specific Chat Features

- [x] 5. Extend chat interface for group-specific features

  - [x] 5.1 Enhance group chat window

    - Display sender name with each message in group chats
    - Show group member count in header
    - Add group settings button in header (admin only)
    - Differentiate AI messages with visual indicator
    - Show multiple typing indicators for group members
    - _Source: group-chat task 6.1, 6.2_

  - [x] 5.2 Add mention functionality
    - Implement @username autocomplete in message input
    - Highlight mentions in messages
    - Add @AI shortcut to mention Group AI Member
    - Show notification badge for messages with user mentions
    - _Source: group-chat task 6.4_

## Phase 6: AI Friend Features (1-on-1)

- [x] 6. Implement AI Friend chat interface

  - [x] 6.1 Create AI Friend chat window

    - Reuse ChatWindow component for AI Friend
    - Add visual indicator that chat is with AI Friend
    - Show learning status message when messageCount < 50
    - Display AI-generated messages with subtle indicator
    - _Source: retro-chat task 10.1_

  - [x] 6.2 Implement AI Friend messaging with streaming

    - Send messages to AI Friend via WebSocket
    - Listen for 'ai-friend:stream-start' event
    - Display streaming chunks as they arrive ('ai-friend:stream-chunk')
    - Show cursor animation during streaming
    - Handle 'ai-friend:stream-end' event
    - Show error message if AI service fails
    - _Source: retro-chat task 10.2_

  - [x] 6.3 Add AI Friend profile management UI
    - Create button to view AI Friend's learned style profile
    - Display style characteristics (common phrases, emoji usage, tone)
    - Add reset button to clear learned style
    - Show confirmation dialog before reset
    - _Source: retro-chat task 10.3_

## Phase 7: Group AI Features

- [x] 7. Implement Group AI interaction UI

  - [x] 7.1 Create Group AI mention interface

    - Add @AI button/shortcut in message input
    - Show Group AI typing indicator when generating response
    - Display streaming response in real-time
    - Show "AI is learning" message if insufficient data (< 100 messages)
    - Mark AI messages with robot icon or badge
    - _Source: group-chat task 7.1_

  - [x] 7.2 Implement Group AI streaming

    - Listen for 'group:ai:stream-start' event
    - Display streaming chunks as they arrive
    - Show cursor animation during streaming
    - Handle 'group:ai:stream-end' event
    - Show error message if AI fails
    - Broadcast streaming to all group members
    - _Source: group-chat task 7.2_

  - [x] 7.3 Create Group AI profile viewer
    - Build GroupAIProfile component showing learned style
    - Display common phrases, emoji usage, tone indicators
    - Show member contributions chart
    - Add "Reset AI" button for admins with confirmation
    - Show message count and learning progress
    - Add toggle to enable/disable Group AI (admin only)
    - _Source: group-chat task 7.3_

## Phase 8: Notifications

- [x] 8. Implement notification system

  - [x] 8.1 Add notification sounds

    - Create NotificationSound component
    - Play sound when receiving new messages (1-on-1 and group)
    - Play sound for friend requests
    - Play sound for group invitations
    - Add user setting to enable/disable sounds
    - _Source: retro-chat task 11.2_

  - [x] 8.2 Add 1-on-1 message notifications

    - Show notification when receiving new messages
    - Display sender name and message preview
    - Show unread badge on contact in list
    - _Source: group-chat task 8.1_

  - [x] 8.3 Add group message notifications

    - Show notification when receiving group message
    - Display sender name and message preview
    - Show unread badge on group in list
    - Highlight notifications for mentions
    - _Source: group-chat task 8.1_

  - [x] 8.4 Add notification preferences

    - Add "Mute Notifications" toggle for each group
    - Store mute preference in groupMembers table
    - Respect mute setting when showing notifications
    - Show muted icon on muted groups
    - _Source: group-chat task 8.2_

  - [x] 8.5 Add group activity notifications
    - Show notification when added to group
    - Show notification when removed from group
    - Show notification when group is deleted
    - Display in-app notification banner
    - _Source: group-chat task 8.3_

## Phase 9: Styling & Polish

- [ ] 9. Add retro MSN Messenger styling and polish

  - [x] 9.1 Implement retro UI theme

    - Create Tailwind CSS custom theme matching MSN Messenger colors
    - Style contact list with classic MSN layout
    - Style chat windows with MSN-style borders and headers
    - Add MSN-style buttons and inputs
    - Apply consistent retro styling across all components
    - _Source: retro-chat task 11.1_

  - [x] 9.2 Implement custom display names

    - Allow users to format display names with special characters
    - Display formatted names in contact list and chat windows
    - Sanitize display names to prevent XSS
    - _Source: retro-chat task 11.3_

  - [x] 9.3 Add loading states and animations
    - Add skeleton loaders for contact list
    - Add loading spinners for message history
    - Add smooth transitions for chat window opening/closing
    - Add typing animation for AI responses
    - _Source: Implicit from all tasks_

## Phase 10: Error Handling & Validation

- [x] 10. Implement comprehensive error handling

  - [x] 10.1 Add frontend error handling

    - Create toast notification component for errors
    - Handle network errors with retry button
    - Handle WebSocket disconnection with reconnection logic
    - Display user-friendly error messages
    - Handle "not a member" errors gracefully
    - Handle "not an admin" errors with clear messages
    - Handle group deletion while viewing
    - _Source: retro-chat task 12.1, group-chat task 10.1_

  - [x] 10.2 Add input validation
    - Validate all user inputs on frontend
    - Validate group name length (max 50 chars)
    - Validate description length (max 200 chars)
    - Validate minimum member count (3 members)
    - Sanitize message content to prevent XSS
    - Validate file uploads (size, type)
    - _Source: retro-chat task 12.3, group-chat task 10.2_

## Phase 11: Testing & Optimization

- [ ] 11. Testing and performance optimization

  - [ ] 11.1 Performance optimization

    - Implement message pagination (50 per page)
    - Optimize re-renders with React.memo
    - Use virtual scrolling for long message lists
    - Lazy load images and profile pictures
    - Debounce typing indicators
    - _Source: group-chat task 10.3_

  - [ ] 11.2 Add comprehensive testing
    - Write unit tests for components
    - Write integration tests for state management
    - Write E2E tests for chat flow
    - Test AI Friend with multiple users
    - Test Group AI with multiple users
    - Test admin permission enforcement
    - _Source: retro-chat task 12, group-chat task 10.4_

## Phase 12: Deployment

- [ ] 12. Set up environment configuration and deployment

  - [ ] 12.1 Configure environment variables

    - Create .env.example file for frontend
    - Document required environment variables
    - Set up environment variables in Vercel dashboard
    - _Source: retro-chat task 13.1_

  - [ ] 12.2 Prepare for Vercel deployment

    - Configure next.config.js for frontend
    - Set up build scripts in package.json
    - Test local builds
    - Optimize bundle size
    - _Source: retro-chat task 13.2_

  - [ ] 12.3 Deploy to Vercel
    - Deploy frontend Next.js app to Vercel
    - Configure custom domains if needed
    - Verify WebSocket connections work in production
    - Test end-to-end functionality in production
    - Test both 1-on-1 and group chat in production
    - _Source: retro-chat task 13.3_

---

## Implementation Notes

### Shared Components to Build:

- **ChatWindow**: Base component used for 1-on-1, AI Friend, and group chats
- **MessageList**: Displays messages with different layouts for 1-on-1 vs group
- **MessageInput**: Handles text input, emoticons, and mentions
- **ContactListItem**: Shows individual contacts or groups with status
- **NotificationToast**: Unified notification system for all alerts

### State Management Strategy:

- **authStore**: User authentication and session
- **contactStore**: Friends, online status, friend requests
- **groupStore**: Groups, members, group settings
- **chatStore**: Messages, conversations, typing indicators (unified for 1-on-1 and group)
- **notificationStore**: Notification preferences and state

### WebSocket Event Handling:

All WebSocket events should be handled in a single connection manager that updates the appropriate stores based on event type.

### Code Reuse Priorities:

1. Build base components first (Phase 4)
2. Extend for group-specific features (Phase 5)
3. Add AI features on top of existing chat components (Phases 6-7)
4. Apply styling consistently across all components (Phase 9)
