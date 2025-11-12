import { create } from "zustand";
import { Message, GroupMessage } from "../api/types";

// Conversation types
export type ConversationType = "direct" | "group" | "ai-friend";

export interface ConversationInfo {
    id: string; // userId for direct/ai-friend, groupId for group
    type: ConversationType;
    name: string;
    avatarUrl?: string;
    lastMessage?: Message | GroupMessage;
    unreadCount: number;
}

export interface TypingUser {
    userId: string;
    username: string;
}

interface ChatState {
    // Active conversation
    activeChat: ConversationInfo | null;
    setActiveChat: (chat: ConversationInfo | null) => void;

    // Conversations list
    conversations: Map<string, ConversationInfo>;
    addConversation: (conversation: ConversationInfo) => void;
    updateConversation: (id: string, updates: Partial<ConversationInfo>) => void;
    removeConversation: (id: string) => void;

    // Messages by conversation
    messages: Map<string, (Message | GroupMessage)[]>;
    addMessage: (conversationId: string, message: Message | GroupMessage) => void;
    setMessages: (conversationId: string, messages: (Message | GroupMessage)[]) => void;
    prependMessages: (conversationId: string, messages: (Message | GroupMessage)[]) => void;
    clearMessages: (conversationId: string) => void;

    // Typing indicators
    typingUsers: Map<string, TypingUser[]>; // conversationId -> typing users
    setTypingUser: (conversationId: string, user: TypingUser) => void;
    removeTypingUser: (conversationId: string, userId: string) => void;
    clearTypingUsers: (conversationId: string) => void;

    // Unread counts
    incrementUnreadCount: (conversationId: string) => void;
    resetUnreadCount: (conversationId: string) => void;
    getTotalUnreadCount: () => number;

    // Message operations
    markMessagesAsRead: (conversationId: string) => void;

    // Clear all state
    clearAll: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    activeChat: null,
    conversations: new Map(),
    messages: new Map(),
    typingUsers: new Map(),

    setActiveChat: (chat) => set({ activeChat: chat }),

    addConversation: (conversation) =>
        set((state) => {
            const newConversations = new Map(state.conversations);
            newConversations.set(conversation.id, conversation);
            return { conversations: newConversations };
        }),

    updateConversation: (id, updates) =>
        set((state) => {
            const newConversations = new Map(state.conversations);
            const existing = newConversations.get(id);
            if (existing) {
                newConversations.set(id, { ...existing, ...updates });
            }
            return { conversations: newConversations };
        }),

    removeConversation: (id) =>
        set((state) => {
            const newConversations = new Map(state.conversations);
            newConversations.delete(id);
            return { conversations: newConversations };
        }),

    addMessage: (conversationId, message) =>
        set((state) => {
            const newMessages = new Map(state.messages);
            const existing = newMessages.get(conversationId) || [];
            newMessages.set(conversationId, [...existing, message]);
            return { messages: newMessages };
        }),

    setMessages: (conversationId, messages) =>
        set((state) => {
            const newMessages = new Map(state.messages);
            newMessages.set(conversationId, messages);
            return { messages: newMessages };
        }),

    prependMessages: (conversationId, messages) =>
        set((state) => {
            const newMessages = new Map(state.messages);
            const existing = newMessages.get(conversationId) || [];
            newMessages.set(conversationId, [...messages, ...existing]);
            return { messages: newMessages };
        }),

    clearMessages: (conversationId) =>
        set((state) => {
            const newMessages = new Map(state.messages);
            newMessages.delete(conversationId);
            return { messages: newMessages };
        }),

    setTypingUser: (conversationId, user) =>
        set((state) => {
            const newTypingUsers = new Map(state.typingUsers);
            const existing = newTypingUsers.get(conversationId) || [];

            // Don't add if already typing
            if (existing.some((u) => u.userId === user.userId)) {
                return state;
            }

            newTypingUsers.set(conversationId, [...existing, user]);
            return { typingUsers: newTypingUsers };
        }),

    removeTypingUser: (conversationId, userId) =>
        set((state) => {
            const newTypingUsers = new Map(state.typingUsers);
            const existing = newTypingUsers.get(conversationId) || [];
            newTypingUsers.set(
                conversationId,
                existing.filter((u) => u.userId !== userId)
            );
            return { typingUsers: newTypingUsers };
        }),

    clearTypingUsers: (conversationId) =>
        set((state) => {
            const newTypingUsers = new Map(state.typingUsers);
            newTypingUsers.delete(conversationId);
            return { typingUsers: newTypingUsers };
        }),

    incrementUnreadCount: (conversationId) =>
        set((state) => {
            const newConversations = new Map(state.conversations);
            const conversation = newConversations.get(conversationId);
            if (conversation) {
                newConversations.set(conversationId, {
                    ...conversation,
                    unreadCount: conversation.unreadCount + 1,
                });
            }
            return { conversations: newConversations };
        }),

    resetUnreadCount: (conversationId) =>
        set((state) => {
            const newConversations = new Map(state.conversations);
            const conversation = newConversations.get(conversationId);
            if (conversation) {
                newConversations.set(conversationId, {
                    ...conversation,
                    unreadCount: 0,
                });
            }
            return { conversations: newConversations };
        }),

    getTotalUnreadCount: () => {
        const { conversations } = get();
        let total = 0;
        conversations.forEach((conv) => {
            total += conv.unreadCount;
        });
        return total;
    },

    markMessagesAsRead: (conversationId) =>
        set((state) => {
            const newMessages = new Map(state.messages);
            const messages = newMessages.get(conversationId);
            if (messages) {
                const updatedMessages = messages.map((msg) => {
                    if ("isRead" in msg && !msg.isRead) {
                        return { ...msg, isRead: true };
                    }
                    return msg;
                });
                newMessages.set(conversationId, updatedMessages);
            }
            return { messages: newMessages };
        }),

    clearAll: () =>
        set({
            activeChat: null,
            conversations: new Map(),
            messages: new Map(),
            typingUsers: new Map(),
        }),
}));
