import { apiClient } from "./client";
import type { Conversation, Message } from "./types";

export const chatService = {
    /**
     * Get unread message count
     */
    getUnreadCount: () => {
        return apiClient.get<{ count: number }>("/api/messages/unread");
    },

    /**
     * Get conversation with a specific user
     */
    getConversation: (userId: string, limit: number = 50) => {
        return apiClient.get<Message[]>(`/api/messages/${userId}`, {
            params: { limit: limit.toString() },
        });
    },

    /**
     * Mark a message as read
     */
    markAsRead: (messageId: string) => {
        return apiClient.post<{ message: string }>(`/api/messages/read/${messageId}`);
    },
};
