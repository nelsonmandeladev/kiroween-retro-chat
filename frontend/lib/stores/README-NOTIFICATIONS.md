# Notification System

The notification system provides comprehensive notification support for the retro chat application.

## Features

### 1. Notification Sounds

- Plays sounds for new messages (1-on-1 and group)
- Plays sounds for friend requests
- Plays sounds for group invitations
- User can enable/disable sounds via settings

### 2. Browser Notifications

- Shows browser notifications when permitted
- Displays sender name and message preview
- Supports notification for mentions in groups
- Respects browser notification permissions

### 3. Toast Notifications

- In-app toast notifications using Sonner
- Different styles for different notification types
- Auto-dismisses after a set duration
- Mentions are highlighted with special styling

### 4. Group Notification Preferences

- Mute/unmute notifications per group
- Muted groups still show notifications for mentions
- Mute status is persisted in the group store
- Visual indicator (🔕) for muted groups in contact list

### 5. Group Activity Notifications

- Notifies when added to a group
- Notifies when removed from a group
- Notifies when a group is deleted
- Shows in-app banner for important activities

## Usage

### Notification Store

```typescript
import { useNotificationStore } from "@/lib/stores/notification-store";

const {
  soundEnabled,
  setSoundEnabled,
  showMessageNotification,
  showGroupMessageNotification,
  requestNotificationPermission,
} = useNotificationStore();

// Enable/disable sounds
setSoundEnabled(true);

// Request browser notification permission
await requestNotificationPermission();

// Show a message notification
showMessageNotification("John Doe", "Hey, how are you?");

// Show a group message notification with mention
showGroupMessageNotification("Team Chat", "Jane", "Hey @you, check this out!", true);
```

### Notification Settings Component

```typescript
import { NotificationSettings } from "@/components/chat";

// Add to your settings page or modal
<NotificationSettings />;
```

### Group Mute Toggle

The mute toggle is integrated into the GroupSettings component. Users can mute/unmute groups from the group settings modal.

## Sound Files

Place your notification sound files in `frontend/public/sounds/`:

- `message.mp3` - For new messages
- `friend-request.mp3` - For friend requests
- `group-invite.mp3` - For group invitations

Recommended: Use short (0.5-2 seconds) MP3 files for best performance.

## Integration

The notification system is automatically integrated with:

- WebSocket events (socket.service.ts)
- Chat store (for unread counts)
- Contact store (for friend notifications)
- Group store (for group notifications and mute preferences)

No additional setup is required beyond adding sound files.
