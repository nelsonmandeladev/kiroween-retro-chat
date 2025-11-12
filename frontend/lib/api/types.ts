// User and Profile Types
export interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    username: string;
    displayName: string;
    statusMessage?: string | null;
    profilePictureUrl?: string | null;
}

export interface UpdateProfileDto {
    displayName?: string;
    statusMessage?: string;
}

export interface SetupProfileDto {
    username: string;
    displayName: string;
    statusMessage?: string;
}

export interface UploadProfilePictureResponse {
    profilePictureUrl: string;
    message: string;
}

// Friend Types
export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: "pending" | "accepted" | "rejected";
    createdAt: string;
    fromUser?: UserProfile;
    toUser?: UserProfile;
}

export interface SendFriendRequestDto {
    toUserId: string;
}

// Message Types
export interface Message {
    id: string;
    fromUserId: string;
    toUserId: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    isAIGenerated: boolean;
    isPending?: boolean; // Optimistic update - message is being sent
}

export interface Conversation {
    messages: Message[];
    otherUser: UserProfile;
}

// AI Friend Types
export interface AIStyleProfile {
    userId?: string; // Optional for group AI profiles
    groupId?: string; // For group AI profiles
    messageCount: number;
    commonPhrases: string[];
    emojiUsage: Record<string, number>;
    averageMessageLength: number;
    toneIndicators: {
        casual: number;
        formal: number;
        enthusiastic: number;
    };
    memberContributions?: Record<string, number>; // For group AI profiles
    lastUpdated: string;
    hasMinimumData: boolean;
}

export interface SendAIMessageDto {
    message: string;
}

export interface AIMessageResponse {
    response: string;
    hasMinimumData: boolean;
}

// Group Types
export interface Group {
    id: string;
    name: string;
    description?: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    aiEnabled: boolean;
    memberCount?: number;
}

export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    isAdmin: boolean;
    joinedAt: string;
    notificationsMuted: boolean;
    user?: UserProfile;
}

export interface GroupMessage {
    id: string;
    groupId: string;
    fromUserId: string;
    content: string;
    timestamp: string;
    isAIGenerated: boolean;
    mentionedUserIds: string[];
    fromUser?: UserProfile;
    isPending?: boolean; // Optimistic update - message is being sent
}

export interface CreateGroupDto {
    name: string;
    description?: string;
    memberIds: string[];
    aiEnabled?: boolean;
}

export interface UpdateGroupDto {
    name?: string;
    description?: string;
}

export interface AddGroupMemberDto {
    userId: string;
}
