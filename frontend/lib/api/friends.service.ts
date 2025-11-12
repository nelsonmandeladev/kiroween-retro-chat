import { apiClient } from "./client";
import type { FriendRequest, SendFriendRequestDto, UserProfile } from "./types";

export const friendsService = {
    /**
     * Send a friend request
     */
    sendFriendRequest: (data: SendFriendRequestDto) => {
        return apiClient.post<FriendRequest>("/api/friends/request", data);
    },

    /**
     * Accept a friend request
     */
    acceptFriendRequest: (requestId: string) => {
        return apiClient.post<{ message: string }>(
            `/api/friends/accept/${requestId}`
        );
    },

    /**
     * Reject a friend request
     */
    rejectFriendRequest: (requestId: string) => {
        return apiClient.post<{ message: string }>(
            `/api/friends/reject/${requestId}`
        );
    },

    /**
     * Get pending friend requests
     */
    getPendingRequests: () => {
        return apiClient.get<FriendRequest[]>("/api/friends/requests");
    },

    /**
     * Get friends list
     */
    getFriends: () => {
        return apiClient.get<UserProfile[]>("/api/friends");
    },
};
