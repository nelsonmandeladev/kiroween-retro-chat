# Group Chat Implementation Plan

- [x] 1. Set up group chat database schema

  - [x] 1.1 Create group-related database tables

    - Define groups table with id, name, description, createdBy, createdAt, updatedAt, aiEnabled
    - Define groupMembers table with id, groupId, userId, isAdmin, joinedAt, notificationsMuted
    - Define groupMessages table with id, groupId, fromUserId, content, timestamp, isAIGenerated, mentionedUserIds
    - Define groupMessageReads table with id, groupMessageId, userId, readAt
    - Define groupStyleProfiles table with groupId, messageCount, memberContributions, commonPhrases, emojiUsage, averageMessageLength, toneIndicators, stylePrompt, lastUpdated
    - Add appropriate indexes for performance
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 1.2 Generate and run database migrations
    - Use Drizzle Kit to generate migration files
    - Execute migrations to create new tables
    - _Requirements: All requirements depend on database setup_

- [x] 2. Implement group management backend

  - [x] 2.1 Create group service

    - Implement createGroup to create group and add creator as admin
    - Implement getGroup to fetch group details with members
    - Implement getUserGroups to fetch all groups for a user
    - Implement updateGroup to update group name and description (admin only)
    - Implement deleteGroup to remove group and all related data (admin only)
    - Implement isUserInGroup to check membership
    - Implement isUserAdmin to check admin status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.4, 7.5_

  - [x] 2.2 Create group member management service

    - Implement addMember to add user to group (admin only)
    - Implement removeMember to remove user from group (admin only)
    - Implement leaveGroup to allow member to leave voluntarily
    - Implement transferAdminIfNeeded to handle last admin leaving
    - Implement getGroupMembers to fetch all members with details
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.4, 4.5_

  - [x] 2.3 Create group API endpoints
    - POST /api/groups - Create new group
    - GET /api/groups - Get user's groups
    - GET /api/groups/:groupId - Get group details
    - PATCH /api/groups/:groupId - Update group (admin only)
    - DELETE /api/groups/:groupId - Delete group (admin only)
    - POST /api/groups/:groupId/members - Add member (admin only)
    - DELETE /api/groups/:groupId/members/:userId - Remove member (admin only)
    - POST /api/groups/:groupId/leave - Leave group
    - GET /api/groups/:groupId/members - Get group members
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 4.1, 7.1, 7.4, 7.5_

- [x] 3. Implement group messaging backend

  - [x] 3.1 Create group message service

    - Implement sendGroupMessage to store message in database
    - Implement getGroupMessages to fetch message history with pagination
    - Implement markGroupMessagesAsRead to update read status for user
    - Implement getUnreadGroupMessageCount to count unread messages across all groups
    - Implement extractMentions to detect @username mentions in messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.4_

  - [x] 3.2 Extend WebSocket gateway for group messaging

    - Handle 'group:message:send' event to save and broadcast group messages
    - Emit 'group:message:receive' event to all online group members
    - Handle 'group:typing' event and broadcast to group members
    - Emit 'group:member:added' event when member joins
    - Emit 'group:member:removed' event when member leaves
    - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4, 8.1, 8.3_

  - [x] 3.3 Create group message API endpoints
    - GET /api/groups/:groupId/messages - Get group messages with pagination
    - POST /api/groups/:groupId/messages/read - Mark messages as read
    - GET /api/groups/unread - Get unread group message count
    - _Requirements: 3.3, 3.4, 3.5, 8.1, 8.2_

- [x] 4. Implement Group AI Member

  - [x] 4.1 Create Group AI initialization service

    - Implement createGroupAIMember to create AI user for each group
    - Create AI user with ID pattern 'group-ai-{groupId}'
    - Add AI member to group automatically on group creation
    - _Requirements: 1.4, 4.2, 5.1_

  - [x] 4.2 Create Group AI style analysis service

    - Extend existing AIStyleAnalysisService to work with group messages
    - Implement analyzeGroupMessages to aggregate patterns from all members
    - Track memberContributions to show who contributes most to group style
    - Weight recent messages more heavily in analysis
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 4.3 Create Group AI profile management service

    - Implement updateGroupStyleProfile to update after every 20 messages
    - Implement getGroupStyleProfile to fetch group's style profile
    - Implement resetGroupStyleProfile to clear learned style (admin only)
    - Generate groupStylePrompt from aggregated patterns
    - Implement shouldUpdateProfile to check if update is needed
    - _Requirements: 5.1, 5.3, 5.4, 7.2_

  - [x] 4.4 Create Group AI response generation service

    - Implement generateGroupAIResponse using OpenAI API
    - Check if group has minimum 100 messages before styled responses
    - Return learning message if insufficient data
    - Use groupStylePrompt to instruct LLM to mimic group's style
    - Implement generateGroupAIResponseStream for real-time streaming
    - Store AI-generated messages with isAIGenerated flag
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.5 Extend WebSocket gateway for Group AI streaming

    - Handle 'group:ai:mention' event when AI is mentioned
    - Emit 'group:ai:stream-start' when streaming begins
    - Emit 'group:ai:stream-chunk' for each response chunk
    - Emit 'group:ai:stream-end' with complete message
    - Trigger style profile updates when group messages are sent
    - _Requirements: 5.4, 6.1, 6.2, 6.3_

  - [x] 4.6 Create Group AI API endpoints
    - GET /api/groups/:groupId/ai/profile - Get group AI style profile
    - POST /api/groups/:groupId/ai/reset - Reset group AI style (admin only)
    - PATCH /api/groups/:groupId/ai/toggle - Enable/disable group AI (admin only)
    - _Requirements: 6.4, 7.2, 7.3_

- [ ] 5. Build frontend group management UI

  - [ ] 5.1 Create group creation interface

    - Build CreateGroupModal component with name and description inputs
    - Add friend selector to choose initial members
    - Implement form validation (name required, min 3 members)
    - Connect to group creation API
    - Show success message and navigate to new group chat
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 5.2 Create group list component

    - Build GroupList component showing user's groups
    - Display group name, member count, and unread badge
    - Show last message preview
    - Add click handler to open group chat
    - Integrate with contact list UI
    - _Requirements: 1.1, 4.1, 4.4, 8.2_

  - [ ] 5.3 Create group settings interface

    - Build GroupSettings component for admins
    - Add inputs to edit group name and description
    - Show member list with remove buttons (admin only)
    - Add "Add Member" button to invite friends
    - Add "Leave Group" button for all members
    - Add "Delete Group" button for admins with confirmation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.4, 7.5_

  - [ ] 5.4 Create group member list component
    - Build GroupMemberList showing all members with avatars
    - Display online status indicators
    - Show admin badges
    - Display Group AI Member with special styling
    - Show member count in header
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Build frontend group chat interface

  - [ ] 6.1 Create group chat window component

    - Build GroupChatWindow extending existing ChatWindow
    - Display group name and member count in header
    - Show sender name with each message
    - Differentiate AI messages with visual indicator
    - Add group settings button in header (admin only)
    - Style with retro MSN Messenger aesthetic
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 6.5_

  - [ ] 6.2 Implement group message sending and receiving

    - Connect message input to WebSocket 'group:message:send' event
    - Listen for 'group:message:receive' events
    - Display typing indicators for multiple users
    - Show "X is typing..." with username
    - Auto-scroll to bottom on new messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 6.3 Implement group message history

    - Fetch group messages when opening chat
    - Display loading state while fetching
    - Implement infinite scroll for older messages
    - Mark messages as read when viewing group
    - Show message timestamps
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ] 6.4 Add mention functionality
    - Implement @username autocomplete in message input
    - Highlight mentions in messages
    - Add @AI shortcut to mention Group AI Member
    - Show notification badge for messages with user mentions
    - _Requirements: 6.1, 8.4_

- [ ] 7. Implement Group AI interaction UI

  - [ ] 7.1 Create Group AI mention interface

    - Add @AI button/shortcut in message input
    - Show Group AI typing indicator when generating response
    - Display streaming response in real-time
    - Show "AI is learning" message if insufficient data
    - Mark AI messages with robot icon or badge
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 7.2 Implement Group AI streaming

    - Listen for 'group:ai:stream-start' event
    - Display streaming chunks as they arrive
    - Show cursor animation during streaming
    - Handle 'group:ai:stream-end' event
    - Show error message if AI fails
    - _Requirements: 6.2, 6.3_

  - [ ] 7.3 Create Group AI profile viewer
    - Build GroupAIProfile component showing learned style
    - Display common phrases, emoji usage, tone indicators
    - Show member contributions chart
    - Add "Reset AI" button for admins with confirmation
    - Show message count and learning progress
    - _Requirements: 5.1, 5.3, 7.2_

- [ ] 8. Implement group notifications

  - [ ] 8.1 Add group notification system

    - Show notification when receiving group message
    - Display sender name and message preview
    - Show unread badge on group in list
    - Highlight notifications for mentions
    - Play notification sound (if enabled)
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ] 8.2 Add notification preferences

    - Add "Mute Notifications" toggle for each group
    - Store mute preference in groupMembers table
    - Respect mute setting when showing notifications
    - Show muted icon on muted groups
    - _Requirements: 8.5_

  - [ ] 8.3 Add group activity notifications
    - Show notification when added to group
    - Show notification when removed from group
    - Show notification when group is deleted
    - Display in-app notification banner
    - _Requirements: 2.2, 7.5, 8.3_

- [ ] 9. Add group state management

  - [ ] 9.1 Create group Zustand store

    - Create store for groups (userGroups, activeGroup, groupMembers)
    - Implement actions to fetch groups, create group, update group
    - Store group messages by groupId
    - Track unread counts per group
    - Handle WebSocket events to update state
    - _Requirements: All group requirements_

  - [ ] 9.2 Integrate with existing chat state
    - Extend existing chat store to handle group chats
    - Share typing indicators logic
    - Reuse message display components where possible
    - Maintain separate state for 1-on-1 vs group chats
    - _Requirements: All group requirements_

- [ ] 10. Testing and polish

  - [ ] 10.1 Add error handling

    - Handle "not a member" errors gracefully
    - Handle "not an admin" errors with clear messages
    - Handle group deletion while viewing
    - Handle network errors with retry
    - Show user-friendly error messages
    - _Requirements: All requirements benefit from error handling_

  - [ ] 10.2 Add input validation

    - Validate group name length (max 50 chars)
    - Validate description length (max 200 chars)
    - Validate minimum member count (3 members)
    - Validate permissions before actions
    - Sanitize all inputs to prevent XSS
    - _Requirements: 1.5, 2.1, 2.2, 2.3_

  - [ ] 10.3 Performance optimization

    - Implement message pagination (50 per page)
    - Cache group member lists in Redis
    - Use Redis pub/sub for typing indicators
    - Batch Group AI style updates
    - Optimize database queries with proper indexes
    - _Requirements: All requirements benefit from performance_

  - [ ] 10.4 Add comprehensive testing
    - Write unit tests for group services
    - Write integration tests for group APIs
    - Write E2E tests for group chat flow
    - Test Group AI with multiple users
    - Test admin permission enforcement
    - _Requirements: All requirements need testing_
