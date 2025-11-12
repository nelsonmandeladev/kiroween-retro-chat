---
inclusion: always
---

# React Component Patterns for RetroChat

## Component Structure

All React components in this project should follow these patterns:

### File Organization

- One component per file
- Co-locate types with components
- Use named exports for components
- Place in appropriate directory: `components/auth/`, `components/chat/`, `components/ui/`

### Component Template

```typescript
"use client";

import { useState } from "react";

interface ComponentNameProps {
  // Props with clear types
  userId: string;
  onAction?: () => void;
}

export function ComponentName({ userId, onAction }: ComponentNameProps) {
  // State declarations
  const [isLoading, setIsLoading] = useState(false);

  // Event handlers
  const handleAction = () => {
    // Implementation
  };

  // Render
  return <div className='retro-container'>{/* JSX */}</div>;
}
```

### State Management

- Use Zustand stores for global state (auth, chat, contacts, groups)
- Use local useState for component-specific UI state
- Never prop-drill more than 2 levels - use stores instead

### Styling

- Use Tailwind CSS classes exclusively
- Follow retro MSN Messenger color scheme:
  - Primary blue: `bg-[#0066CC]`
  - Window gray: `bg-[#ECE9D8]`
  - Border: `border-[#0054A6]`
- Use custom classes defined in `globals.css` for retro effects

### Error Handling

- Always wrap async operations in try-catch
- Use the centralized error handler: `handleError(error, 'Context')`
- Display user-friendly messages via toast notifications
- Never expose technical error details to users

### WebSocket Events

- All WebSocket listeners should be in `socket.service.ts`
- Update Zustand stores from socket events
- Clean up listeners on component unmount
- Handle reconnection gracefully

### Performance

- Use React.memo for expensive list items
- Debounce typing indicators (300ms)
- Lazy load images with loading states
- Implement virtual scrolling for message lists > 100 items
