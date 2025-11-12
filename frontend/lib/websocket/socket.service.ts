import { io, Socket } from "socket.io-client";
import { Message, GroupMessage, FriendRequest, UserProfile } from "../api/types";
import { useChatStore } from "../stores/chat-store";
import { useContactStore, OnlineStatus } from "../stores/contact-store";
import { useGroupStore } from "../stores/group-store";
import { useNotificationStore } from "../stores/notification-store";
import { useAuthStore } from "../stores/auth-store";
import { handleWebSocketError } from "../utils/error-handler";
import { toast } from "sonner";

// WebSocket event types
interface ServerToClientEvents {
    // User status events
    "user:status": (data: { userId: string; status: OnlineStatus }) => void;
    "user:status-batch": (data: { statuses: Array<{ userId: string; status: OnlineStatus }> }) => void;

    // Friend request events
    "friend:request": (request: FriendRequest) => void;
    "friend:accepted": (acceptedRequest: FriendRequest) => void;

    // Direct message events
    "message:receive": (message: Message) => void;
    "message:sent": (message: Message) => void;
    "user:typing": (data: { fromUserId: string }) => void;

    // Group message events
    "group:message:receive": (message: GroupMessage) => void;
    "group:message:sent": (message: GroupMessage) => void;
    "group:typing": (data: { groupId: string; userId: string; username: string }) => void;

    // Group member events
    "group:member:added": (data: { groupId: string; member: UserProfile }) => void;
    "group:member:removed": (data: { groupId: string; userId: string }) => void;
    "group:deleted": (data: { groupId: string; groupName: string }) => void;

    // Group AI events
    "group:ai:stream-start": (data: { groupId: string; messageId: string }) => void;
    "group:ai:stream-chunk": (data: {
        groupId: string;
        chunk: string;
        fullResponse: string;
    }) => void;
    "group:ai:stream-end": (data: { groupId: string; message: GroupMessage }) => void;
    "group:ai:error": (data: { groupId: string; error: string }) => void;

    // AI Friend events
    "ai-friend:user-message-sent": (message: Message) => void;
    "ai-friend:stream-start": (data: { messageId: string }) => void;
    "ai-friend:stream-chunk": (data: { chunk: string; fullResponse: string }) => void;
    "ai-friend:stream-end": (data: { message: Message }) => void;
    "ai-friend:error": (data: { error: string }) => void;
}

interface ClientToServerEvents {
    // User status events
    "user:online": () => void;
    "user:check-status": (data: { userIds: string[] }) => void;
    "user:typing": (data: { toUserId: string }) => void;

    // Direct message events
    "message:send": (data: { toUserId: string; content: string }) => void;

    // AI Friend events
    "ai-friend:message": (data: { content: string }) => void;

    // Group message events
    "group:message:send": (data: { groupId: string; content: string }) => void;
    "group:typing": (data: { groupId: string }) => void;

    // Group AI events
    "group:ai:mention": (data: { groupId: string; content: string }) => void;
}

class SocketService {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000; // Start with 1 second
    private maxReconnectDelay = 30000; // Max 30 seconds
    private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

    connect(token?: string): void {
        if (this.socket?.connected) {
            return;
        }

        const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

        this.socket = io(url, {
            withCredentials: true, // Important: Send cookies with the request
            auth: {
                token, // Keep this for backwards compatibility, but cookies are primary
            },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
        });

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        if (!this.socket) return;

        // Connection events
        this.socket.on("connect", () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;

            // Show reconnection success if this was a reconnect
            if (this.reconnectAttempts > 0) {
                toast.success("Reconnected", {
                    description: "You're back online!",
                    duration: 2000,
                });
            }

            // Emit user online status
            this.socket?.emit("user:online");
        });

        this.socket.on("disconnect", (reason) => {
            console.log("WebSocket disconnected:", reason);

            // Show user-friendly disconnect message
            if (reason === "io server disconnect") {
                toast.warning("Disconnected", {
                    description: "Attempting to reconnect...",
                    duration: 3000,
                });
                // Server disconnected, try to reconnect
                this.handleReconnect();
            } else if (reason === "transport close" || reason === "transport error") {
                toast.warning("Connection lost", {
                    description: "Attempting to reconnect...",
                    duration: 3000,
                });
            }
        });

        this.socket.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error);

            // Only show error toast on first attempt or every 5th attempt
            if (this.reconnectAttempts === 0 || this.reconnectAttempts % 5 === 0) {
                handleWebSocketError(error);
            }

            this.handleReconnect();
        });

        // User status events
        this.socket.on("user:status", ({ userId, status }) => {
            useContactStore.getState().updateOnlineStatus(userId, status);
        });

        // Batch status update
        this.socket.on("user:status-batch", ({ statuses }) => {
            const contactStore = useContactStore.getState();
            statuses.forEach(({ userId, status }) => {
                contactStore.updateOnlineStatus(userId, status);
            });
        });

        // Friend request events
        this.socket.on("friend:request", (request) => {
            const notificationStore = useNotificationStore.getState();
            useContactStore.getState().addFriendRequest(request);
            notificationStore.playFriendRequestSound();
            if (request.fromUser) {
                notificationStore.showFriendRequestNotification(request.fromUser.displayName);
            }
        });

        // Friend request accepted event
        this.socket.on("friend:accepted", (acceptedRequest) => {
            const contactStore = useContactStore.getState();
            const notificationStore = useNotificationStore.getState();

            // Remove the friend request from the list
            if (acceptedRequest.id) {
                contactStore.removeFriendRequest(acceptedRequest.id);
            }

            // Add the new friend to the friends list (the person who accepted)
            if (acceptedRequest.toUser) {
                contactStore.addFriend(acceptedRequest.toUser);
            }

            // Show notification
            if (acceptedRequest.toUser?.displayName) {
                notificationStore.playFriendRequestSound();
                // Could add a toast notification here
            }
        });

        // Direct message events
        this.socket.on("message:receive", (message) => {
            const chatStore = useChatStore.getState();
            const contactStore = useContactStore.getState();
            const notificationStore = useNotificationStore.getState();

            // Add message to chat store
            chatStore.addMessage(message.fromUserId, message);

            // Update conversation last message
            chatStore.updateConversation(message.fromUserId, {
                lastMessage: message,
            });

            // Increment unread count if not in active chat
            if (chatStore.activeChat?.id !== message.fromUserId) {
                chatStore.incrementUnreadCount(message.fromUserId);
                contactStore.incrementUnreadCount(message.fromUserId);
                notificationStore.playMessageSound();

                // Show notification
                const friend = contactStore.friends.get(message.fromUserId);
                if (friend) {
                    const preview = message.content.length > 50
                        ? message.content.substring(0, 50) + "..."
                        : message.content;
                    notificationStore.showMessageNotification(friend.displayName, preview);
                }
            }
        });

        // Message sent confirmation (for sender to see their own message)
        this.socket.on("message:sent", (message) => {
            const chatStore = useChatStore.getState();
            const messages = chatStore.messages.get(message.toUserId) || [];

            // Replace the optimistic message with the real one
            const updatedMessages = messages.map((msg) =>
                msg.isPending && msg.content === message.content
                    ? { ...message, isPending: false }
                    : msg
            );

            // If no optimistic message was found, add the message
            if (!messages.some((msg) => msg.isPending && msg.content === message.content)) {
                updatedMessages.push(message);
            }

            chatStore.setMessages(message.toUserId, updatedMessages);

            // Update conversation last message
            chatStore.updateConversation(message.toUserId, {
                lastMessage: message,
            });
        });

        this.socket.on("user:typing", ({ fromUserId }) => {
            const chatStore = useChatStore.getState();
            const contactStore = useContactStore.getState();
            const friend = contactStore.friends.get(fromUserId);

            if (friend) {
                chatStore.setTypingUser(fromUserId, {
                    userId: fromUserId,
                    username: friend.displayName,
                });

                // Clear typing indicator after 3 seconds
                const existingTimeout = this.typingTimeouts.get(fromUserId);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                }

                const timeout = setTimeout(() => {
                    chatStore.removeTypingUser(fromUserId, fromUserId);
                    this.typingTimeouts.delete(fromUserId);
                }, 3000);

                this.typingTimeouts.set(fromUserId, timeout);
            }
        });

        // Group message events
        this.socket.on("group:message:receive", (message) => {
            const chatStore = useChatStore.getState();
            const groupStore = useGroupStore.getState();
            const notificationStore = useNotificationStore.getState();
            const authStore = useAuthStore.getState();

            // Add message to chat store
            chatStore.addMessage(message.groupId, message);

            // Update conversation last message
            chatStore.updateConversation(message.groupId, {
                lastMessage: message,
            });

            // Increment unread count if not in active chat
            if (chatStore.activeChat?.id !== message.groupId) {
                chatStore.incrementUnreadCount(message.groupId);
                groupStore.incrementUnreadCount(message.groupId);

                // Show notification only if group is not muted
                const group = groupStore.userGroups.get(message.groupId);
                const currentUserId = authStore.user?.id;

                if (group && !group.isMuted) {
                    notificationStore.playMessageSound();

                    // Check if current user is mentioned
                    const hasMention = !!(currentUserId && message.mentionedUserIds?.includes(currentUserId));

                    // Get sender name from group members
                    const sender = group.members.find(m => m.userId === message.fromUserId);
                    const senderName = sender?.user?.displayName || "Someone";

                    const preview = message.content.length > 50
                        ? message.content.substring(0, 50) + "..."
                        : message.content;

                    notificationStore.showGroupMessageNotification(
                        group.name,
                        senderName,
                        preview,
                        hasMention
                    );
                } else if (group && group.isMuted) {
                    // Still show notification for mentions even if muted
                    const hasMention = currentUserId && message.mentionedUserIds?.includes(currentUserId);
                    if (hasMention) {
                        notificationStore.playMessageSound();

                        const sender = group.members.find(m => m.userId === message.fromUserId);
                        const senderName = sender?.user?.displayName || "Someone";

                        const preview = message.content.length > 50
                            ? message.content.substring(0, 50) + "..."
                            : message.content;

                        notificationStore.showGroupMessageNotification(
                            group.name,
                            senderName,
                            preview,
                            true
                        );
                    }
                }
            }
        });

        // Group message sent confirmation (for sender to see their own message)
        this.socket.on("group:message:sent", (message) => {
            const chatStore = useChatStore.getState();
            const messages = chatStore.messages.get(message.groupId) || [];

            // Replace the optimistic message with the real one
            const updatedMessages = messages.map((msg) =>
                msg.isPending && msg.content === message.content
                    ? { ...message, isPending: false }
                    : msg
            );

            // If no optimistic message was found, add the message
            if (!messages.some((msg) => msg.isPending && msg.content === message.content)) {
                updatedMessages.push(message);
            }

            chatStore.setMessages(message.groupId, updatedMessages);

            // Update conversation last message
            chatStore.updateConversation(message.groupId, {
                lastMessage: message,
            });
        });

        this.socket.on("group:typing", ({ groupId, userId, username }) => {
            const chatStore = useChatStore.getState();

            chatStore.setTypingUser(groupId, { userId, username });

            // Clear typing indicator after 3 seconds
            const key = `${groupId}-${userId}`;
            const existingTimeout = this.typingTimeouts.get(key);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            const timeout = setTimeout(() => {
                chatStore.removeTypingUser(groupId, userId);
                this.typingTimeouts.delete(key);
            }, 3000);

            this.typingTimeouts.set(key, timeout);
        });

        // Group member events
        this.socket.on("group:member:added", ({ groupId }) => {
            const groupStore = useGroupStore.getState();
            const notificationStore = useNotificationStore.getState();

            // Refresh group members
            groupStore.fetchGroupMembers(groupId);

            // Check if current user was added
            const group = groupStore.userGroups.get(groupId);
            if (!group) {
                // This is a new group for the current user
                notificationStore.playGroupInviteSound();
                // Refresh groups list to include the new group
                groupStore.fetchUserGroups();
            }
        });

        this.socket.on("group:member:removed", ({ groupId, userId }) => {
            const groupStore = useGroupStore.getState();
            const notificationStore = useNotificationStore.getState();
            const authStore = useAuthStore.getState();

            // Check if current user was removed
            if (userId === authStore.user?.id) {
                const group = groupStore.userGroups.get(groupId);
                if (group) {
                    notificationStore.showGroupActivityNotification("removed", group.name);
                    groupStore.removeGroup(groupId);
                }
            } else {
                groupStore.removeGroupMember(groupId, userId);
            }
        });

        this.socket.on("group:deleted", ({ groupId, groupName }) => {
            const groupStore = useGroupStore.getState();
            const chatStore = useChatStore.getState();
            const notificationStore = useNotificationStore.getState();

            notificationStore.showGroupActivityNotification("deleted", groupName);
            groupStore.removeGroup(groupId);

            // Close the chat window if the deleted group is currently active
            if (chatStore.activeChat?.id === groupId) {
                chatStore.setActiveChat(null);
            }
        });

        // Group AI streaming events
        this.socket.on("group:ai:stream-start", ({ groupId, messageId }) => {
            console.log("Group AI stream started:", groupId, messageId);
            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent("group:ai:stream-start", { detail: { groupId, messageId } }));
        });

        this.socket.on("group:ai:stream-chunk", ({ groupId, fullResponse }) => {
            const chatStore = useChatStore.getState();
            const messages = chatStore.messages.get(groupId) || [];

            // Find or create the AI message
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.isAIGenerated) {
                // Update existing message
                const updatedMessages = [...messages];
                updatedMessages[updatedMessages.length - 1] = {
                    ...lastMessage,
                    content: fullResponse,
                };
                chatStore.setMessages(groupId, updatedMessages);
            } else {
                // Create new streaming message if it doesn't exist
                const streamingMessage: GroupMessage = {
                    id: "group-ai-streaming-temp",
                    groupId,
                    fromUserId: `group-ai-${groupId}`,
                    content: fullResponse,
                    timestamp: new Date().toISOString(),
                    isAIGenerated: true,
                    mentionedUserIds: [],
                };
                chatStore.addMessage(groupId, streamingMessage);
            }
        });

        this.socket.on("group:ai:stream-end", ({ groupId, message }) => {
            const chatStore = useChatStore.getState();
            const messages = chatStore.messages.get(groupId) || [];

            // Replace the streaming message with the final one
            const updatedMessages = messages.filter((m) => m.id === "group-ai-streaming-temp" || m.id === "group-ai-streaming-placeholder" ? false : true);
            chatStore.setMessages(groupId, [...updatedMessages, message]);

            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent("group:ai:stream-end", { detail: { groupId, message } }));
        });

        // Group AI error handling
        this.socket.on("group:ai:error", (data: { groupId: string; error: string }) => {
            console.error("Group AI error:", data.error);

            // Show user-friendly error message
            toast.error("Group AI Error", {
                description: "Failed to generate AI response. Please try again.",
                duration: 4000,
            });

            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent("group:ai:stream-error", { detail: { groupId: data.groupId, error: data.error } }));
        });

        // AI Friend streaming events
        this.socket.on("ai-friend:user-message-sent", (message) => {
            const chatStore = useChatStore.getState();
            const aiFriendId = "ai-friend";
            const messages = chatStore.messages.get(aiFriendId) || [];

            // Replace the optimistic message with the real one
            const updatedMessages = messages.map((msg) =>
                msg.isPending && msg.content === message.content
                    ? { ...message, isPending: false }
                    : msg
            );

            // If no optimistic message was found, add the message
            if (!messages.some((msg) => msg.isPending && msg.content === message.content)) {
                updatedMessages.push(message);
            }

            chatStore.setMessages(aiFriendId, updatedMessages);

            // Update conversation last message
            chatStore.updateConversation(aiFriendId, {
                lastMessage: message,
            });
        });

        this.socket.on("ai-friend:stream-start", ({ messageId }) => {
            console.log("AI Friend stream started:", messageId);
            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent("ai-friend:stream-start", { detail: { messageId } }));
        });

        this.socket.on("ai-friend:stream-chunk", ({ fullResponse }) => {
            const chatStore = useChatStore.getState();
            const aiFriendId = "ai-friend"; // Special ID for AI Friend
            const messages = chatStore.messages.get(aiFriendId) || [];

            // Find or create the AI message
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.isAIGenerated) {
                // Update existing message
                const updatedMessages = [...messages];
                updatedMessages[updatedMessages.length - 1] = {
                    ...lastMessage,
                    content: fullResponse,
                };
                chatStore.setMessages(aiFriendId, updatedMessages);
            } else {
                // Create new streaming message if it doesn't exist
                const streamingMessage: Message = {
                    id: "streaming-temp",
                    fromUserId: "ai-friend",
                    toUserId: "",
                    content: fullResponse,
                    timestamp: new Date().toISOString(),
                    isRead: true,
                    isAIGenerated: true,
                };
                chatStore.addMessage(aiFriendId, streamingMessage);
            }
        });

        this.socket.on("ai-friend:stream-end", ({ message }) => {
            const chatStore = useChatStore.getState();
            const aiFriendId = "ai-friend";
            const messages = chatStore.messages.get(aiFriendId) || [];

            // Replace the streaming message with the final one
            const updatedMessages = messages.filter((m) => m.id === "streaming-temp" || m.id === "streaming-placeholder" ? false : true);
            chatStore.setMessages(aiFriendId, [...updatedMessages, message]);

            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent("ai-friend:stream-end", { detail: { message } }));
        });

        // AI Friend error handling
        this.socket.on("ai-friend:error", (data: { error: string }) => {
            console.error("AI Friend error:", data.error);

            // Show user-friendly error message
            toast.error("AI Friend Error", {
                description: "Failed to generate AI response. Please try again.",
                duration: 4000,
            });

            // Dispatch custom event for UI components
            window.dispatchEvent(new CustomEvent("ai-friend:stream-error", { detail: { error: data.error } }));
        });
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("Max reconnection attempts reached");
            return;
        }

        this.reconnectAttempts++;

        // Exponential backoff
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.socket?.connect();
        }, delay);
    }

    // Emit events
    sendMessage(toUserId: string, content: string): void {
        this.socket?.emit("message:send", { toUserId, content });
    }

    sendTyping(toUserId: string): void {
        this.socket?.emit("user:typing", { toUserId });
    }

    checkUserStatuses(userIds: string[]): void {
        this.socket?.emit("user:check-status", { userIds });
    }

    sendAIFriendMessage(content: string): void {
        this.socket?.emit("ai-friend:message", { content });
    }

    sendGroupMessage(groupId: string, content: string): void {
        this.socket?.emit("group:message:send", { groupId, content });
    }

    sendGroupTyping(groupId: string): void {
        this.socket?.emit("group:typing", { groupId });
    }

    mentionGroupAI(groupId: string, content: string): void {
        this.socket?.emit("group:ai:mention", { groupId, content });
    }

    disconnect(): void {
        // Clear all typing timeouts
        this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.typingTimeouts.clear();

        this.socket?.disconnect();
        this.socket = null;
        this.reconnectAttempts = 0;
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
