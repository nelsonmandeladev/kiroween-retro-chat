import { create } from "zustand";
import { Group, GroupMember, CreateGroupDto, UpdateGroupDto } from "../api/types";
import { groupsService } from "../api/groups.service";
import { handleGroupError } from "../utils/error-handler";

export interface GroupWithMembers extends Group {
    members: GroupMember[];
    unreadCount: number;
    isMuted?: boolean;
}

interface GroupState {
    // Groups
    userGroups: Map<string, GroupWithMembers>;
    setGroups: (groups: Group[]) => void;
    addGroup: (group: Group) => void;
    updateGroup: (groupId: string, updates: Partial<Group>) => void;
    removeGroup: (groupId: string) => void;

    // Active group
    activeGroup: GroupWithMembers | null;
    setActiveGroup: (group: GroupWithMembers | null) => void;

    // Group members
    groupMembers: Map<string, GroupMember[]>; // groupId -> members
    setGroupMembers: (groupId: string, members: GroupMember[]) => void;
    addGroupMember: (groupId: string, member: GroupMember) => void;
    removeGroupMember: (groupId: string, userId: string) => void;

    // Unread counts
    updateUnreadCount: (groupId: string, count: number) => void;
    incrementUnreadCount: (groupId: string) => void;
    resetUnreadCount: (groupId: string) => void;

    // Actions
    fetchUserGroups: () => Promise<void>;
    fetchGroupMembers: (groupId: string) => Promise<void>;
    createGroup: (data: Omit<CreateGroupDto, "memberIds">, memberIds: string[]) => Promise<Group>;
    updateGroupDetails: (groupId: string, updates: UpdateGroupDto) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    addMember: (groupId: string, userId: string) => Promise<void>;
    removeMember: (groupId: string, userId: string) => Promise<void>;
    leaveGroup: (groupId: string) => Promise<void>;

    // Notification preferences
    muteGroup: (groupId: string) => void;
    unmuteGroup: (groupId: string) => void;
    toggleMute: (groupId: string) => void;
    isGroupMuted: (groupId: string) => boolean;

    // Helper methods
    isUserAdmin: (groupId: string, userId: string) => boolean;
    getGroupById: (groupId: string) => GroupWithMembers | undefined;

    // Loading states
    loading: boolean;
    setLoading: (loading: boolean) => void;

    // Clear all state
    clearAll: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
    userGroups: new Map(),
    activeGroup: null,
    groupMembers: new Map(),
    loading: false,

    setGroups: (groups) =>
        set(() => {
            const groupsMap = new Map<string, GroupWithMembers>();
            groups.forEach((group) => {
                groupsMap.set(group.id, {
                    ...group,
                    members: [],
                    unreadCount: 0,
                });
            });
            return { userGroups: groupsMap };
        }),

    addGroup: (group) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            newGroups.set(group.id, {
                ...group,
                members: [],
                unreadCount: 0,
            });
            return { userGroups: newGroups };
        }),

    updateGroup: (groupId, updates) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, ...updates });
            }
            return { userGroups: newGroups };
        }),

    removeGroup: (groupId) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            newGroups.delete(groupId);

            const newGroupMembers = new Map(state.groupMembers);
            newGroupMembers.delete(groupId);

            return {
                userGroups: newGroups,
                groupMembers: newGroupMembers,
                activeGroup: state.activeGroup?.id === groupId ? null : state.activeGroup,
            };
        }),

    setActiveGroup: (group) => set({ activeGroup: group }),

    setGroupMembers: (groupId, members) =>
        set((state) => {
            const newGroupMembers = new Map(state.groupMembers);
            newGroupMembers.set(groupId, members);

            // Update the group with members
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, members });
            }

            return { groupMembers: newGroupMembers, userGroups: newGroups };
        }),

    addGroupMember: (groupId, member) =>
        set((state) => {
            const newGroupMembers = new Map(state.groupMembers);
            const existing = newGroupMembers.get(groupId) || [];
            newGroupMembers.set(groupId, [...existing, member]);

            // Update the group with new members
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, members: [...existing, member] });
            }

            return { groupMembers: newGroupMembers, userGroups: newGroups };
        }),

    removeGroupMember: (groupId, userId) =>
        set((state) => {
            const newGroupMembers = new Map(state.groupMembers);
            const existing = newGroupMembers.get(groupId) || [];
            const updated = existing.filter((m) => m.userId !== userId);
            newGroupMembers.set(groupId, updated);

            // Update the group with new members
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, members: updated });
            }

            return { groupMembers: newGroupMembers, userGroups: newGroups };
        }),

    updateUnreadCount: (groupId, count) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, unreadCount: count });
            }
            return { userGroups: newGroups };
        }),

    incrementUnreadCount: (groupId) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, {
                    ...group,
                    unreadCount: group.unreadCount + 1,
                });
            }
            return { userGroups: newGroups };
        }),

    resetUnreadCount: (groupId) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, unreadCount: 0 });
            }
            return { userGroups: newGroups };
        }),

    fetchUserGroups: async () => {
        set({ loading: true });
        try {
            const groups = await groupsService.getGroups();
            get().setGroups(groups);

            // Fetch members for all groups to display member counts
            await Promise.all(
                groups.map(group => get().fetchGroupMembers(group.id))
            );
        } catch (error) {
            console.error("Failed to fetch user groups:", error);
            handleGroupError(error, () => get().fetchUserGroups());
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    fetchGroupMembers: async (groupId) => {
        try {
            const members = await groupsService.getMembers(groupId);
            get().setGroupMembers(groupId, members);
        } catch (error) {
            console.error("Failed to fetch group members:", error);
            handleGroupError(error, () => get().fetchGroupMembers(groupId));
            throw error;
        }
    },

    createGroup: async (data, memberIds) => {
        try {
            // Include memberIds in the initial group creation request
            const group = await groupsService.createGroup({
                ...data,
                memberIds,
            });

            get().addGroup(group);
            return group;
        } catch (error) {
            console.error("Failed to create group:", error);
            handleGroupError(error);
            throw error;
        }
    },

    updateGroupDetails: async (groupId, updates) => {
        try {
            const updatedGroup = await groupsService.updateGroup(groupId, updates);
            get().updateGroup(groupId, updatedGroup);
        } catch (error) {
            console.error("Failed to update group:", error);
            handleGroupError(error, () => get().updateGroupDetails(groupId, updates));
            throw error;
        }
    },

    deleteGroup: async (groupId) => {
        try {
            await groupsService.deleteGroup(groupId);
            get().removeGroup(groupId);
        } catch (error) {
            console.error("Failed to delete group:", error);
            handleGroupError(error);
            throw error;
        }
    },

    addMember: async (groupId, userId) => {
        try {
            await groupsService.addMember(groupId, { userId });
            // Refresh group members
            await get().fetchGroupMembers(groupId);
        } catch (error) {
            console.error("Failed to add member:", error);
            handleGroupError(error, () => get().addMember(groupId, userId));
            throw error;
        }
    },

    removeMember: async (groupId, userId) => {
        try {
            await groupsService.removeMember(groupId, userId);
            get().removeGroupMember(groupId, userId);
        } catch (error) {
            console.error("Failed to remove member:", error);
            handleGroupError(error, () => get().removeMember(groupId, userId));
            throw error;
        }
    },

    leaveGroup: async (groupId) => {
        try {
            await groupsService.leaveGroup(groupId);
            get().removeGroup(groupId);
        } catch (error) {
            console.error("Failed to leave group:", error);
            handleGroupError(error);
            throw error;
        }
    },

    muteGroup: (groupId) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, isMuted: true });
            }
            return { userGroups: newGroups };
        }),

    unmuteGroup: (groupId) =>
        set((state) => {
            const newGroups = new Map(state.userGroups);
            const group = newGroups.get(groupId);
            if (group) {
                newGroups.set(groupId, { ...group, isMuted: false });
            }
            return { userGroups: newGroups };
        }),

    toggleMute: (groupId) => {
        const group = get().userGroups.get(groupId);
        if (group?.isMuted) {
            get().unmuteGroup(groupId);
        } else {
            get().muteGroup(groupId);
        }
    },

    isGroupMuted: (groupId) => {
        const group = get().userGroups.get(groupId);
        return group?.isMuted || false;
    },

    isUserAdmin: (groupId, userId) => {
        const members = get().groupMembers.get(groupId) || [];
        const member = members.find((m) => m.userId === userId);
        return member?.isAdmin || false;
    },

    getGroupById: (groupId) => {
        return get().userGroups.get(groupId);
    },

    setLoading: (loading) => set({ loading }),

    clearAll: () =>
        set({
            userGroups: new Map(),
            activeGroup: null,
            groupMembers: new Map(),
            loading: false,
        }),
}));
