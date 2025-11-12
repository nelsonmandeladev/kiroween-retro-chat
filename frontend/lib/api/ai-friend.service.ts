import { apiClient } from "./client";
import type {
    AIStyleProfile,
    SendAIMessageDto,
    AIMessageResponse,
} from "./types";

export const aiFriendService = {
    /**
     * Send message to AI Friend and get response
     */
    sendMessage: (data: SendAIMessageDto) => {
        return apiClient.post<AIMessageResponse>("/api/ai-friend/message", data);
    },

    /**
     * Get AI Friend's learned style profile
     */
    getStyleProfile: () => {
        return apiClient.get<AIStyleProfile>("/api/ai-friend/profile");
    },

    /**
     * Reset AI Friend's learned style
     */
    resetStyle: () => {
        return apiClient.post<{ message: string }>("/api/ai-friend/reset");
    },
};
