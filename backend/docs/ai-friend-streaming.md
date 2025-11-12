# AI Friend Streaming Implementation

## Overview

The AI Friend feature now supports **real-time streaming responses** similar to ChatGPT, providing a better user experience where users can see the AI response being typed character by character.

## Implementation Details

### Two Communication Methods

#### 1. REST API (Non-Streaming)

- **Endpoint**: `POST /ai-friend/message`
- **Use Case**: Simple request-response pattern
- **Response**: Complete message returned at once
- **Best For**: Mobile apps, simple integrations

#### 2. WebSocket (Streaming) ⭐ Recommended

- **Event**: `ai-friend:message`
- **Use Case**: Real-time chat experience
- **Response**: Streamed chunks as they're generated
- **Best For**: Web chat interfaces, real-time applications

## WebSocket Events

### Client → Server

#### `ai-friend:message`

Send a message to AI Friend with streaming response.

```typescript
socket.emit('ai-friend:message', {
  content: 'Hey! How are you doing today?',
});
```

### Server → Client

#### `ai-friend:user-message-sent`

Acknowledgment that user's message was saved.

```typescript
socket.on('ai-friend:user-message-sent', (message) => {
  console.log('User message saved:', message);
  // message contains: id, fromUserId, toUserId, content, timestamp, etc.
});
```

#### `ai-friend:stream-start`

Indicates streaming has started.

```typescript
socket.on('ai-friend:stream-start', (data) => {
  console.log('AI response streaming started');
  // data contains: { messageId }
});
```

#### `ai-friend:stream-chunk`

Receives each chunk of the AI response as it's generated.

```typescript
socket.on('ai-friend:stream-chunk', (data) => {
  console.log('Chunk:', data.chunk);
  console.log('Full response so far:', data.fullResponse);
  // Update UI with the new chunk
});
```

#### `ai-friend:stream-end`

Indicates streaming is complete with the final message.

```typescript
socket.on('ai-friend:stream-end', (data) => {
  console.log('AI response complete:', data.message);
  // data.message contains the complete saved message
});
```

#### `ai-friend:error`

Error occurred during AI response generation.

```typescript
socket.on('ai-friend:error', (data) => {
  console.error('AI Friend error:', data.error);
});
```

## Frontend Implementation Example

### React/TypeScript Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function AIFriendChat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3001', {
      auth: {
        token: 'your-auth-token-here'
      }
    });

    // Listen for streaming events
    newSocket.on('ai-friend:stream-start', () => {
      setIsStreaming(true);
      setStreamingMessage('');
    });

    newSocket.on('ai-friend:stream-chunk', (data) => {
      setStreamingMessage(data.fullResponse);
    });

    newSocket.on('ai-friend:stream-end', (data) => {
      setIsStreaming(false);
      // Save the complete message to your messages list
      console.log('Complete message:', data.message);
    });

    newSocket.on('ai-friend:error', (data) => {
      setIsStreaming(false);
      console.error('Error:', data.error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = (content: string) => {
    if (socket) {
      socket.emit('ai-friend:message', { content });
    }
  };

  return (
    <div>
      {/* Your chat UI */}
      {isStreaming && (
        <div className="streaming-message">
          {streamingMessage}
          <span className="cursor">▊</span>
        </div>
      )}
      <button onClick={() => sendMessage('Hello!')}>
        Send Message
      </button>
    </div>
  );
}
```

## How It Works

1. **User sends message** via WebSocket event `ai-friend:message`
2. **Server saves user message** to database
3. **Server checks style profile** and updates if needed (every 10 messages)
4. **Server generates AI response** using OpenAI streaming API
5. **Server streams chunks** to client via `ai-friend:stream-chunk` events
6. **Server saves complete response** to database
7. **Server sends final message** via `ai-friend:stream-end` event

## Benefits of Streaming

✅ **Better UX**: Users see responses appear in real-time  
✅ **Perceived Performance**: Feels faster even though total time is similar  
✅ **Engagement**: More interactive and ChatGPT-like experience  
✅ **Feedback**: Users know the AI is working immediately

## Fallback to REST API

If WebSocket connection fails or for simpler integrations, the REST API endpoint still works:

```typescript
// POST /ai-friend/message
const response = await fetch('/ai-friend/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your-token',
  },
  body: JSON.stringify({
    content: 'Hello!',
  }),
});

const data = await response.json();
// data contains: { userMessage, aiResponse }
```

## Technical Details

- **Model**: GPT-4o-mini with streaming enabled
- **Temperature**: 0.9 (for varied, natural responses)
- **Max Tokens**: 150 per response
- **Minimum Messages**: 50 messages required before styled responses
- **Style Update Frequency**: Every 10 messages
