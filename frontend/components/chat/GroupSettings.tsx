"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { Button } from "@/components/retroui/Button";
import { Avatar } from "@/components/retroui/Avatar";
import { Badge } from "@/components/retroui/Badge";
import { FormField } from "@/components/forms/FormField";
import { useGroupStore } from "@/lib/stores/group-store";
import { useContactStore } from "@/lib/stores/contact-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatDisplayName } from "@/lib/utils/display-name";
import { validateGroupName, validateGroupDescription } from "@/lib/utils/validation";
import { toast } from "sonner";
import {
    Settings,
    UserPlus,
    UserMinus,
    LogOut,
    Trash2,
    Shield,
    Bell,
    BellOff,
} from "lucide-react";

const updateGroupSchema = z.object({
    name: z
        .string()
        .min(1, "Group name is required")
        .max(50, "Group name must be 50 characters or less")
        .refine((val) => val === val.trim(), {
            message: "Group name cannot have leading or trailing spaces",
        }),
    description: z
        .string()
        .max(200, "Description must be 200 characters or less")
        .optional()
        .or(z.literal("")),
});

type UpdateGroupFormData = z.infer<typeof updateGroupSchema>;

interface GroupSettingsProps {
    groupId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupDeleted?: () => void;
    onLeftGroup?: () => void;
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({
    groupId,
    open,
    onOpenChange,
    onGroupDeleted,
    onLeftGroup,
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    const { user } = useAuthStore();
    const { friends } = useContactStore();
    const {
        getGroupById,
        isUserAdmin,
        updateGroupDetails,
        deleteGroup,
        leaveGroup,
        addMember,
        removeMember,
        fetchGroupMembers,
        toggleMute,
    } = useGroupStore();

    const group = getGroupById(groupId);
    const isAdmin = user ? isUserAdmin(groupId, user.id) : false;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm<UpdateGroupFormData>({
        resolver: zodResolver(updateGroupSchema),
        defaultValues: {
            name: group?.name || "",
            description: group?.description || "",
        },
    });

    const nameValue = watch("name") || "";
    const descriptionValue = watch("description") || "";

    useEffect(() => {
        if (group) {
            reset({
                name: group.name,
                description: group.description || "",
            });
        }
    }, [group, reset]);

    useEffect(() => {
        if (open && groupId) {
            fetchGroupMembers(groupId);
        }
    }, [open, groupId, fetchGroupMembers]);

    if (!group) {
        return null;
    }

    const onSubmit = async (data: UpdateGroupFormData) => {
        if (!isAdmin) {
            toast.error("Only admins can update group settings");
            return;
        }

        try {
            await updateGroupDetails(groupId, {
                name: data.name.trim(),
                description: data.description?.trim() || undefined,
            });
            toast.success("Group updated successfully!");
        } catch (error) {
            console.error("Failed to update group:", error);
            toast.error("Failed to update group");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!isAdmin) {
            toast.error("Only admins can remove members");
            return;
        }

        try {
            await removeMember(groupId, userId);
            toast.success("Member removed successfully");
        } catch (error) {
            console.error("Failed to remove member:", error);
            toast.error("Failed to remove member");
        }
    };

    const handleAddMember = async (userId: string) => {
        if (!isAdmin) {
            toast.error("Only admins can add members");
            return;
        }

        try {
            await addMember(groupId, userId);
            toast.success("Member added successfully");
            setShowAddMember(false);
        } catch (error) {
            console.error("Failed to add member:", error);
            toast.error("Failed to add member");
        }
    };

    const handleLeaveGroup = async () => {
        try {
            await leaveGroup(groupId);
            toast.success("Left group successfully");
            onOpenChange(false);
            if (onLeftGroup) {
                onLeftGroup();
            }
        } catch (error) {
            console.error("Failed to leave group:", error);
            toast.error("Failed to leave group");
        }
    };

    const handleDeleteGroup = async () => {
        if (!isAdmin) {
            toast.error("Only admins can delete the group");
            return;
        }

        try {
            await deleteGroup(groupId);
            toast.success("Group deleted successfully");
            onOpenChange(false);
            if (onGroupDeleted) {
                onGroupDeleted();
            }
        } catch (error) {
            console.error("Failed to delete group:", error);
            toast.error("Failed to delete group");
        }
    };

    // Get friends not in group
    const friendsList = Array.from(friends.values());
    const memberIds = new Set(group.members.map((m) => m.userId));
    const availableFriends = friendsList.filter((f) => !memberIds.has(f.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content size="lg">
                <Dialog.Header>
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        <span>Group Settings</span>
                    </div>
                </Dialog.Header>

                <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
                    {/* Group Info Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <FormField
                            label="Group Name"
                            htmlFor="name"
                            required
                            error={errors.name?.message}
                        >
                            <Input
                                id="name"
                                type="text"
                                aria-invalid={!!errors.name}
                                disabled={!isAdmin || isSubmitting}
                                {...register("name")}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                {nameValue.length}/50 characters
                            </div>
                        </FormField>

                        <FormField
                            label="Description"
                            htmlFor="description"
                            error={errors.description?.message}
                        >
                            <Textarea
                                id="description"
                                rows={3}
                                disabled={!isAdmin || isSubmitting}
                                {...register("description")}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                {descriptionValue.length}/200 characters
                            </div>
                        </FormField>

                        {isAdmin && (
                            <Button type="submit" disabled={isSubmitting} size="sm">
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        )}
                    </form>

                    {/* Notification Settings */}
                    <div className="border-2 rounded p-3">
                        <div className="text-sm font-semibold mb-2">Notifications</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMute(groupId)}
                            className="w-full"
                        >
                            {group.isMuted ? (
                                <>
                                    <Bell className="w-4 h-4 mr-2" />
                                    Unmute Notifications
                                </>
                            ) : (
                                <>
                                    <BellOff className="w-4 h-4 mr-2" />
                                    Mute Notifications
                                </>
                            )}
                        </Button>
                        <div className="text-xs text-muted-foreground mt-2">
                            {group.isMuted
                                ? "You'll only be notified when mentioned"
                                : "You'll receive all notifications from this group"}
                        </div>
                    </div>

                    {/* Members List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold">
                                Members ({group.members.length})
                            </label>
                            {isAdmin && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAddMember(!showAddMember)}
                                >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Add Member
                                </Button>
                            )}
                        </div>

                        {/* Add Member Section */}
                        {showAddMember && isAdmin && (
                            <div className="mb-3 p-3 border-2 rounded bg-muted/50">
                                <div className="text-sm font-semibold mb-2">
                                    Select a friend to add:
                                </div>
                                {availableFriends.length === 0 ? (
                                    <div className="text-xs text-muted-foreground">
                                        All your friends are already in this group
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                                        {availableFriends.map((friend) => (
                                            <div
                                                key={friend.id}
                                                className="flex items-center gap-2 p-2 hover:bg-background rounded"
                                            >
                                                <Avatar className="h-8 w-8">
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
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold truncate">
                                                        {formatDisplayName(friend.displayName)}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddMember(friend.id)}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <div className="flex flex-col gap-2 border-2 rounded p-2 max-h-64 overflow-y-auto">
                            {group.members.map((member) => {
                                const isCurrentUser = member.userId === user?.id;
                                const isGroupAI = member.userId.startsWith("group-ai-");

                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 p-2 hover:bg-muted rounded"
                                    >
                                        <Avatar className="h-10 w-10">
                                            {member.user?.profilePictureUrl ? (
                                                <Avatar.Image
                                                    src={member.user.profilePictureUrl}
                                                    alt={member.user.displayName}
                                                />
                                            ) : (
                                                <Avatar.Fallback>
                                                    {isGroupAI
                                                        ? "🤖"
                                                        : member.user?.displayName.charAt(0).toUpperCase()}
                                                </Avatar.Fallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm truncate">
                                                    {formatDisplayName(member.user?.displayName || "Unknown")}
                                                    {isCurrentUser && " (You)"}
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
                                                {isGroupAI && (
                                                    <Badge variant="outline" size="sm">
                                                        AI
                                                    </Badge>
                                                )}
                                            </div>
                                            {member.user?.username && (
                                                <div className="text-xs text-muted-foreground truncate">
                                                    @{member.user.username}
                                                </div>
                                            )}
                                        </div>
                                        {isAdmin && !isCurrentUser && !isGroupAI && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleRemoveMember(member.userId)}
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-2 border-red-500 rounded p-3">
                        <div className="text-sm font-semibold text-red-500 mb-3">
                            Danger Zone
                        </div>

                        {/* Leave Group */}
                        <div className="mb-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleLeaveGroup}
                                className="w-full"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave Group
                            </Button>
                        </div>

                        {/* Delete Group (Admin Only) */}
                        {isAdmin && (
                            <div>
                                {!showDeleteConfirm ? (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Group
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-xs text-red-500">
                                            Are you sure? This action cannot be undone.
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleDeleteGroup}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                            >
                                                Yes, Delete
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <Dialog.Footer>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
};