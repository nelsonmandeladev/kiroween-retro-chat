"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Avatar } from "@/components/retroui/Avatar";
import { FormField } from "@/components/forms/FormField";
import { useContactStore } from "@/lib/stores/contact-store";
import { useGroupStore } from "@/lib/stores/group-store";
import { formatDisplayName } from "@/lib/utils/display-name";
import { validateGroupName, validateGroupDescription, validateGroupMemberCount } from "@/lib/utils/validation";
import { toast } from "sonner";
import { Users } from "lucide-react";

const createGroupSchema = z.object({
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

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (groupId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
}) => {
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
        new Set()
    );

    const { friends } = useContactStore();
    const { createGroup } = useGroupStore();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setError,
    } = useForm<CreateGroupFormData>({
        resolver: zodResolver(createGroupSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const friendsList = Array.from(friends.values());
    const nameValue = watch("name") || "";
    const descriptionValue = watch("description") || "";

    const handleToggleMember = (userId: string) => {
        setSelectedMembers((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const onSubmit = async (data: CreateGroupFormData) => {
        // Validate member selection using validation utility
        const memberValidation = validateGroupMemberCount(Array.from(selectedMembers));
        if (!memberValidation.isValid) {
            setError("root", {
                message: memberValidation.error,
            });
            return;
        }

        // Additional validation for name and description
        const nameValidation = validateGroupName(data.name);
        if (!nameValidation.isValid) {
            setError("name", {
                message: nameValidation.error,
            });
            return;
        }

        const descriptionValidation = validateGroupDescription(data.description);
        if (!descriptionValidation.isValid) {
            setError("description", {
                message: descriptionValidation.error,
            });
            return;
        }

        try {
            const group = await createGroup(
                {
                    name: data.name.trim(),
                    description: data.description?.trim() || undefined,
                },
                Array.from(selectedMembers)
            );

            toast.success("Group created successfully!");

            // Reset form
            reset();
            setSelectedMembers(new Set());

            // Close modal
            onOpenChange(false);

            // Notify parent
            if (onSuccess) {
                onSuccess(group.id);
            }
        } catch (error) {
            console.error("Failed to create group:", error);
            // Error is already handled by the store with toast
        }
    };

    const handleCancel = () => {
        reset();
        setSelectedMembers(new Set());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content size="md">
                <Dialog.Header>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>Create Group</span>
                    </div>
                </Dialog.Header>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-4 p-4 max-h-[60vh] overflow-y-auto">
                        {/* Group Name */}
                        <FormField
                            label="Group Name"
                            htmlFor="name"
                            required
                            error={errors.name?.message}
                        >
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter group name..."
                                aria-invalid={!!errors.name}
                                disabled={isSubmitting}
                                {...register("name")}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                {nameValue.length}/50 characters
                            </div>
                        </FormField>

                        {/* Description */}
                        <FormField
                            label="Description"
                            htmlFor="description"
                            error={errors.description?.message}
                        >
                            <Textarea
                                id="description"
                                placeholder="Enter group description..."
                                rows={3}
                                disabled={isSubmitting}
                                {...register("description")}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                                {descriptionValue.length}/200 characters
                            </div>
                        </FormField>

                        {/* Member Selection */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Select Members <span className="text-red-500">*</span>
                            </label>
                            <div className="text-xs text-muted-foreground mb-3">
                                Select at least 2 friends (minimum 3 members including you)
                            </div>

                            {friendsList.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4 border-2 rounded">
                                    <p className="text-sm">No friends available</p>
                                    <p className="text-xs mt-1">
                                        Add friends first to create a group
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto border-2 rounded p-2">
                                    {friendsList.map((friend) => (
                                        <label
                                            key={friend.id}
                                            className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                                        >
                                            <Checkbox
                                                checked={selectedMembers.has(friend.id)}
                                                onCheckedChange={() => handleToggleMember(friend.id)}
                                                disabled={isSubmitting}
                                            />
                                            <Avatar className="h-10 w-10">
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
                                                <div className="font-semibold text-sm truncate">
                                                    {formatDisplayName(friend.displayName)}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    @{friend.username}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground mt-2">
                                {selectedMembers.size} friend
                                {selectedMembers.size !== 1 ? "s" : ""} selected
                                {selectedMembers.size > 0 &&
                                    ` (${selectedMembers.size + 1} total members)`}
                            </div>
                        </div>

                        {/* Error Message */}
                        {errors.root && (
                            <p className="text-sm text-destructive">{errors.root.message}</p>
                        )}
                    </div>

                    <Dialog.Footer>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Group"}
                        </Button>
                    </Dialog.Footer>
                </form>
            </Dialog.Content>
        </Dialog>
    );
};
