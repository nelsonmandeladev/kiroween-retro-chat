"use client";

import React, { useEffect } from "react";
import { Avatar } from "@/components/retroui/Avatar";
import { Badge } from "@/components/retroui/Badge";
import { useGroupStore } from "@/lib/stores/group-store";
import { useContactStore, OnlineStatus } from "@/lib/stores/contact-store";
import { formatDisplayName } from "@/lib/utils/display-name";
import { cn } from "@/lib/utils";
import { Shield, Users } from "lucide-react";

interface GroupMemberListProps {
    groupId: string;
    className?: string;
}

const StatusIndicator: React.FC<{ status: OnlineStatus }> = ({ status }) => {
    const statusColors = {
        online: "bg-green-500",
        away: "bg-orange-500",
        offline: "bg-red-500",
    };

    return (
        <div
            className={cn(
                "w-3 h-3 rounded-full border-2 border-white",
                statusColors[status]
            )}
            title={status}
        />
    );
};

export const GroupMemberList: React.FC<GroupMemberListProps> = ({
    groupId,
    className,
}) => {
    const { getGroupById, fetchGroupMembers } = useGroupStore();
    const { getOnlineStatus } = useContactStore();

    const group = getGroupById(groupId);

    useEffect(() => {
        if (groupId) {
            fetchGroupMembers(groupId);
        }
    }, [groupId, fetchGroupMembers]);

    if (!group) {
        return null;
    }

    const members = group.members || [];

    // Separate Group AI from regular members
    const groupAIMember = members.find((m) => m.userId.startsWith("group-ai-"));
    const regularMembers = members.filter(
        (m) => !m.userId.startsWith("group-ai-")
    );

    // Sort members: admins first, then by name
    const sortedMembers = [...regularMembers].sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return (a.user?.displayName || "").localeCompare(
            b.user?.displayName || ""
        );
    });

    return (
        <div className={cn("flex flex-col h-full bg-background", className)}>
            {/* Header */}
            <div className="px-4 py-3 border-b-2 bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">Members</span>
                    <Badge variant="solid" size="sm" className="bg-white text-black">
                        {members.length}
                    </Badge>
                </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto">
                {/* Group AI Member */}
                {groupAIMember && (
                    <div className="border-b-2">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                            AI MEMBER
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-secondary/20">
                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-secondary">
                                    <Avatar.Fallback className="text-lg bg-secondary text-secondary-foreground">
                                        🤖
                                    </Avatar.Fallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0">
                                    <StatusIndicator status="online" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">
                                        {formatDisplayName(groupAIMember.user?.displayName || "Group AI")}
                                    </span>
                                    <Badge
                                        variant="solid"
                                        size="sm"
                                        className="bg-secondary text-secondary-foreground"
                                    >
                                        AI
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Learning from the group
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Regular Members */}
                {sortedMembers.length > 0 && (
                    <div>
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                            MEMBERS ({sortedMembers.length})
                        </div>
                        {sortedMembers.map((member) => {
                            const onlineStatus = getOnlineStatus(member.userId);

                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-3 border-b hover:bg-muted transition-colors"
                                >
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            {member.user?.profilePictureUrl ? (
                                                <Avatar.Image
                                                    src={member.user.profilePictureUrl}
                                                    alt={member.user.displayName}
                                                />
                                            ) : (
                                                <Avatar.Fallback>
                                                    {member.user?.displayName.charAt(0).toUpperCase() ||
                                                        "?"}
                                                </Avatar.Fallback>
                                            )}
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0">
                                            <StatusIndicator status={onlineStatus} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm truncate">
                                                {formatDisplayName(member.user?.displayName || "Unknown User")}
                                            </span>
                                            {member.isAdmin && (
                                                <Badge
                                                    variant="solid"
                                                    size="sm"
                                                    className="bg-yellow-500 text-black"
                                                >
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Admin
                                                </Badge>
                                            )}
                                        </div>
                                        {member.user?.statusMessage && (
                                            <div className="text-xs text-muted-foreground truncate">
                                                {formatDisplayName(member.user.statusMessage)}
                                            </div>
                                        )}
                                        {member.user?.username && (
                                            <div className="text-xs text-muted-foreground truncate">
                                                @{member.user.username}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {members.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm">No members found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
