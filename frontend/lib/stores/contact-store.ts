import { create } from "zustand";
import { UserProfile, FriendRequest } from "../api/types";
import { friendsService } from "../api/friends.service";

export type OnlineStatus = "online" | "away" | "offline";

export interface ContactWithStatus extends UserProfile {
    status: OnlineStatus;
    unreadCount: number;
}

interface ContactState {
    // Friends list
    friends: Map<string, ContactWithStatus>;
    setFriends: (friends: UserProfile[]) => void;
    addFriend: (friend: UserProfile) => void;
    removeFriend: (userId: string) => void;

    // Online status
    updateOnlineStatus: (userId: string, status: OnlineStatus) => void;
    getOnlineStatus: (userId: string) => OnlineStatus;

    // Friend requests
    friendRequests: FriendRequest[];
    setFriendRequests: (requests: FriendRequest[]) => void;
    addFriendRequest: (request: FriendRequest) => void;
    removeFriendRequest: (requestId: string) => void;

    // Unread counts
    updateUnreadCount: (userId: string, count: number) => void;
    incrementUnreadCount: (userId: string) => void;
    resetUnreadCount: (userId: string) => void;

    // Actions
    fetchFriends: () => Promise<void>;
    fetchFriendRequests: () => Promise<void>;
    sendFriendRequest: (toUserId: string) => Promise<void>;
    acceptFriendRequest: (requestId: string) => Promise<void>;
    rejectFriendRequest: (requestId: string) => Promise<void>;

    // Loading states
    loading: boolean;
    setLoading: (loading: boolean) => void;

    // Clear all state
    clearAll: () => void;
}

export const useContactStore = create<ContactState>((set, get) => ({
    friends: new Map(),
    friendRequests: [],
    loading: false,

    setFriends: (friends) =>
        set(() => {
            const friendsMap = new Map<string, ContactWithStatus>();
            friends.forEach((friend) => {
                friendsMap.set(friend.id, {
                    ...friend,
                    status: "offline",
                    unreadCount: 0,
                });
            });
            return { friends: friendsMap };
        }),

    addFriend: (friend) =>
        set((state) => {
            const newFriends = new Map(state.friends);
            newFriends.set(friend.id, {
                ...friend,
                status: "offline",
                unreadCount: 0,
            });
            return { friends: newFriends };
        }),

    removeFriend: (userId) =>
        set((state) => {
            const newFriends = new Map(state.friends);
            newFriends.delete(userId);
            return { friends: newFriends };
        }),

    updateOnlineStatus: (userId, status) =>
        set((state) => {
            const newFriends = new Map(state.friends);
            const friend = newFriends.get(userId);
            if (friend) {
                newFriends.set(userId, { ...friend, status });
            }
            return { friends: newFriends };
        }),

    getOnlineStatus: (userId) => {
        const friend = get().friends.get(userId);
        return friend?.status || "offline";
    },

    setFriendRequests: (requests) => set({ friendRequests: requests }),

    addFriendRequest: (request) =>
        set((state) => ({
            friendRequests: [...state.friendRequests, request],
        })),

    removeFriendRequest: (requestId) =>
        set((state) => ({
            friendRequests: state.friendRequests.filter((req) => req.id !== requestId),
        })),

    updateUnreadCount: (userId, count) =>
        set((state) => {
            const newFriends = new Map(state.friends);
            const friend = newFriends.get(userId);
            if (friend) {
                newFriends.set(userId, { ...friend, unreadCount: count });
            }
            return { friends: newFriends };
        }),

    incrementUnreadCount: (userId) =>
        set((state) => {
            const newFriends = new Map(state.friends);
            const friend = newFriends.get(userId);
            if (friend) {
                newFriends.set(userId, {
                    ...friend,
                    unreadCount: friend.unreadCount + 1,
                });
            }
            return { friends: newFriends };
        }),

    resetUnreadCount: (userId) =>
        set((state) => {
            const newFriends = new Map(state.friends);
            const friend = newFriends.get(userId);
            if (friend) {
                newFriends.set(userId, { ...friend, unreadCount: 0 });
            }
            return { friends: newFriends };
        }),

    fetchFriends: async () => {
        set({ loading: true });
        try {
            const friends = await friendsService.getFriends();
            get().setFriends(friends);

            // Request online status for all friends via WebSocket
            const { socketService } = await import("../websocket/socket.service");
            const friendIds = friends.map(f => f.id);
            if (friendIds.length > 0 && socketService.isConnected()) {
                socketService.checkUserStatuses(friendIds);
            }
        } catch (error) {
            console.error("Failed to fetch friends:", error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    fetchFriendRequests: async () => {
        try {
            const requests = await friendsService.getPendingRequests();
            set({ friendRequests: requests });
        } catch (error) {
            console.error("Failed to fetch friend requests:", error);
            throw error;
        }
    },

    sendFriendRequest: async (toUserId) => {
        try {
            const request = await friendsService.sendFriendRequest({ toUserId });
            get().addFriendRequest(request);
        } catch (error) {
            console.error("Failed to send friend request:", error);
            throw error;
        }
    },

    acceptFriendRequest: async (requestId) => {
        try {
            await friendsService.acceptFriendRequest(requestId);
            get().removeFriendRequest(requestId);
            // Refresh friends list to include the new friend
            await get().fetchFriends();
        } catch (error) {
            console.error("Failed to accept friend request:", error);
            throw error;
        }
    },

    rejectFriendRequest: async (requestId) => {
        try {
            await friendsService.rejectFriendRequest(requestId);
            get().removeFriendRequest(requestId);
        } catch (error) {
            console.error("Failed to reject friend request:", error);
            throw error;
        }
    },

    setLoading: (loading) => set({ loading }),

    clearAll: () =>
        set({
            friends: new Map(),
            friendRequests: [],
            loading: false,
        }),
}));
