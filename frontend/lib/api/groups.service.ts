import { apiClient } from "./client";
import type {
    Group,
    GroupMember,
    GroupMessage,
    CreateGroupDto,
    UpdateGroupDto,
    AddGroupMemberDto,
    AIStyleProfile,
} from "./types";

export const groupsService = {
    /**
     * Create a new group
     */
    createGroup: (data: CreateGroupDto) => {
        return apiClient.post<Group>("/api/groups", data);
    },

    /**
     * Get user's groups
     */
    getGroups: () => {
        return apiClient.get<Group[]>("/api/groups");
    },

    /**
     * Get unread group message count
     */
    getUnreadCount: () => {
        return apiClient.get<{ unreadCount: number }>("/api/groups/unread");
    },

    /**
     * Get group details
     */
    getGroup: (groupId: string) => {
        return apiClient.get<Group>(`/api/groups/${groupId}`);
    },

    /**
     * Update group
     */
    updateGroup: (groupId: string, data: UpdateGroupDto) => {
        return apiClient.patch<Group>(`/api/groups/${groupId}`, data);
    },

    /**
     * Delete group
     */
    deleteGroup: (groupId: string) => {
        return apiClient.delete<{ message: string }>(`/api/groups/${groupId}`);
    },

    /**
     * Add member to group
     */
    addMember: (groupId: string, data: AddGroupMemberDto) => {
        return apiClient.post<GroupMember>(
            `/api/groups/${groupId}/members`,
            data
        );
    },

    /**
     * Remove member from group
     */
    removeMember: (groupId: string, userId: string) => {
        return apiClient.delete<{ message: string }>(
            `/api/groups/${groupId}/members/${userId}`
        );
    },

    /**
     * Leave group
     */
    leaveGroup: (groupId: string) => {
        return apiClient.post<{ message: string }>(
            `/api/groups/${groupId}/leave`
        );
    },

    /**
     * Get group members
     */
    getMembers: (groupId: string) => {
        return apiClient.get<GroupMember[]>(`/api/groups/${groupId}/members`);
    },

    /**
     * Get group messages
     */
    getMessages: (groupId: string, limit: number = 50, before?: string) => {
        const params: Record<string, string> = { limit: limit.toString() };
        if (before) {
            params.before = before;
        }
        return apiClient.get<GroupMessage[]>(
            `/api/groups/${groupId}/messages`,
            { params }
        );
    },

    /**
     * Mark messages as read
     */
    markMessagesAsRead: (groupId: string, messageIds: string[]) => {
        return apiClient.post<{ message: string }>(
            `/api/groups/${groupId}/messages/read`,
            { messageIds }
        );
    },

    /**
     * Get group AI style profile
     */
    getAIProfile: (groupId: string) => {
        return apiClient.get<AIStyleProfile>(`/api/groups/${groupId}/ai/profile`);
    },

    /**
     * Reset group AI style
     */
    resetAIStyle: (groupId: string) => {
        return apiClient.post<{ message: string }>(
            `/api/groups/${groupId}/ai/reset`
        );
    },

    /**
     * Enable/disable group AI
     */
    toggleAI: (groupId: string, enabled: boolean) => {
        return apiClient.patch<Group>(`/api/groups/${groupId}/ai/toggle`, {
            aiEnabled: enabled,
        });
    },
};
