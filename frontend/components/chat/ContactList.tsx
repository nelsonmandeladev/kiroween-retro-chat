"use client";

import React from "react";
import { useContactStore, OnlineStatus } from "@/lib/stores/contact-store";
import { useGroupStore } from "@/lib/stores/group-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Avatar } from "@/components/retroui/Avatar";
import { cn } from "@/lib/utils";
import { formatDisplayName } from "@/lib/utils/display-name";
import { AnimatedGhostIcon } from "@/components/ui/AnimatedGhostIcon";
import { ContactListSkeleton } from "./ContactListSkeleton";

interface ContactListProps {
    onContactClick?: (userId: string, type: "direct" | "ai-friend") => void;
    onGroupClick?: (groupId: string) => void;
    className?: string;
    isLoading?: boolean;
}

const StatusIndicator: React.FC<{ status: OnlineStatus }> = ({ status }) => {
    const statusClasses = {
        online: "msn-status-online",
        away: "msn-status-away",
        offline: "msn-status-offline",
    };

    return (
        <div
            className={statusClasses[status]}
            title={status}
        />
    );
};

export const ContactList: React.FC<ContactListProps> = ({
    onContactClick,
    onGroupClick,
    className,
    isLoading = false,
}) => {
    const { friends } = useContactStore();
    const { userGroups } = useGroupStore();
    const { user } = useAuthStore();

    const friendsList = Array.from(friends.values());
    const groupsList = Array.from(userGroups.values());

    // Show skeleton loader while loading
    if (isLoading) {
        return <ContactListSkeleton />;
    }

    // Kirhost contact (AI Friend)
    const kirhost = {
        id: `ai-friend-${user?.id}`,
        displayName: "Kirhost",
        profilePictureUrl: null,
        status: "online" as OnlineStatus,
        unreadCount: 0,
    };

    const handleContactClick = (userId: string, isAI: boolean) => {
        if (onContactClick) {
            onContactClick(userId, isAI ? "ai-friend" : "direct");
        }
    };

    const handleGroupClick = (groupId: string) => {
        if (onGroupClick) {
            onGroupClick(groupId);
        }
    };

    return (
        <div className={cn("flex flex-col h-full msn-panel", className)}>
            {/* Kirhost - Always at top */}
            <div
                className="msn-contact-item flex flex-row items-center gap-2.5"
                onClick={() => handleContactClick(kirhost.id, true)}
            >
                <div className="relative">
                    <Avatar className="h-12 w-12">
                        <Avatar.Fallback className="bg-purple-100 flex items-center justify-center">
                            <AnimatedGhostIcon width={24} height={28} />
                        </Avatar.Fallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0">
                        <StatusIndicator status="online" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                        {kirhost.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                        Your personal AI companion
                    </div>
                </div>
                {kirhost.unreadCount > 0 && (
                    <span className="msn-badge">
                        {kirhost.unreadCount}
                    </span>
                )}
            </div>

            {/* Scrollable contacts and groups */}
            <div className="flex-1 overflow-y-auto msn-scrollbar">
                {/* Friends Section */}
                {friendsList.length > 0 && (
                    <div className="msn-divider">
                        <div className="px-3 py-2 text-xs font-bold text-(--msn-blue) bg-(--msn-button-bg)">
                            FRIENDS ({friendsList.length})
                        </div>
                        {friendsList.map((friend) => (
                            <div
                                key={friend.id}
                                className="msn-contact-item flex items-center gap-3"
                                onClick={() => handleContactClick(friend.id, false)}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        {friend.profilePictureUrl ? (
                                            <Avatar.Image
                                                src={friend.profilePictureUrl}
                                                alt={friend.displayName}
                                            />
                                        ) : (
                                            <Avatar.Fallback>
                                                {friend.displayName.charAt(0).toUpperCase()}
                                            </Avatar.Fallback>
                                        )}
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0">
                                        <StatusIndicator status={friend.status} />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm truncate">
                                        {formatDisplayName(friend.displayName)}
                                    </div>
                                    {friend.statusMessage && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {formatDisplayName(friend.statusMessage)}
                                        </div>
                                    )}
                                </div>
                                {friend.unreadCount > 0 && (
                                    <span className="msn-badge">
                                        {friend.unreadCount}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Groups Section */}
                {groupsList.length > 0 && (
                    <div>
                        <div className="px-3 py-2 text-xs font-bold text-(--msn-blue) bg-(--msn-button-bg)">
                            GROUPS ({groupsList.length})
                        </div>
                        {groupsList.map((group) => (
                            <div
                                key={group.id}
                                className="msn-contact-item flex items-center gap-3"
                                onClick={() => handleGroupClick(group.id)}
                            >
                                <div className="relative">
                                    <Avatar className="h-12 w-12">
                                        <Avatar.Fallback className="bg-blue-100 flex items-center justify-center">
                                            <AnimatedGhostIcon width={24} height={28} variant="group" />
                                        </Avatar.Fallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 bg-white rounded-full px-1 border border-gray-300">
                                        <span className="text-xs font-bold text-[var(--msn-blue)]">
                                            {group.members.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold text-sm truncate">
                                            {formatDisplayName(group.name)}
                                        </div>
                                        {group.isMuted && (
                                            <span className="text-xs" title="Notifications muted">
                                                🔕
                                            </span>
                                        )}
                                    </div>
                                    {group.description && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {formatDisplayName(group.description)}
                                        </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                        {group.members.length} members
                                    </div>
                                </div>
                                {group.unreadCount > 0 && (
                                    <span className="msn-badge">
                                        {group.unreadCount}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {friendsList.length === 0 && groupsList.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <p className="text-sm">No contacts or groups yet</p>
                        <p className="text-xs mt-2">
                            Add friends or create a group to get started!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
