# Group Chat Fixes

## Issues Fixed

### 1. Group Member Count Not Showing on App Load

**Problem**: When the app loads, group member counts show as 0 until you open the group chat.

**Root Cause**: In `group-store.ts`, the `fetchUserGroups()` function was only fetching the group list but not the members. The members array was initialized as empty (`members: []`), and members were only fetched when opening a specific group.

**Solution**: Modified `fetchUserGroups()` to automatically fetch members for all groups after loading the group list:

```typescript
fetchUserGroups: async () => {
    set({ loading: true });
    try {
        const groups = await groupsService.getGroups();
        get().setGroups(groups);

        // Fetch members for all groups to display member counts
        await Promise.all(
            groups.map(group => get().fetchGroupMembers(group.id))
        );
    } catch (error) {
        console.error("Failed to fetch user groups:", error);
        handleGroupError(error, () => get().fetchUserGroups());
        throw error;
    } finally {
        set({ loading: false });
    }
},
```

### 2. Unread Message Count Not Resetting When Opening Chat

**Problem**: When opening a group chat or one-to-one chat with unread messages, the unread count badge doesn't reset until the app is reloaded.

**Root Cause**: In `ChatWindow.tsx`, the `resetUnreadCount()` function was only called on the `chatStore`, but not on the `contactStore` (for direct messages) or `groupStore` (for group messages). Each store maintains its own unread count for display in the contact list.

**Solution**: Modified the message loading effect in `ChatWindow.tsx` to reset unread counts in all relevant stores:

```typescript
// Mark messages as read and reset unread counts in all stores
markMessagesAsRead(conversation.id);
resetUnreadCount(conversation.id);

// Reset unread count in contact store for direct messages
if (!isGroupChat && !isAIFriend) {
  useContactStore.getState().resetUnreadCount(conversation.id);
}

// Reset unread count in group store for group messages
if (isGroupChat) {
  useGroupStore.getState().resetUnreadCount(conversation.id);
}
```

## Files Modified

1. `frontend/lib/stores/group-store.ts` - Updated `fetchUserGroups()` to fetch members
2. `frontend/components/chat/ChatWindow.tsx` - Added unread count reset for all stores
3. `frontend/components/chat/ChatWindow.tsx` - Added missing `useContactStore` import

## Testing Recommendations

1. **Group Member Count**:

   - Log in and verify that group member counts display correctly in the contact list immediately
   - Create a new group and verify the count updates

2. **Unread Count Reset**:
   - Send messages to yourself from another account in both direct and group chats
   - Verify unread badges appear in the contact list
   - Open each chat and verify the badge disappears immediately without needing to reload

## Performance Considerations

The change to fetch all group members on app load will result in additional API calls. For users with many groups, this could impact initial load time. Consider these optimizations if needed:

- Add pagination or lazy loading for groups
- Cache member counts in the group list API response
- Implement a background refresh strategy
