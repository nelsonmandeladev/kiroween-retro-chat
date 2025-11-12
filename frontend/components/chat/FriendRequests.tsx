"use client";

import React, { useEffect } from "react";
import { useContactStore } from "@/lib/stores/contact-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Dialog } from "@/components/retroui/Dialog";
import { Avatar } from "@/components/retroui/Avatar";
import { Button } from "@/components/retroui/Button";
import { Badge } from "@/components/retroui/Badge";
import { formatDisplayName } from "@/lib/utils/display-name";
import { Check, X, Clock, Bell } from "lucide-react";
import { toast } from "sonner";

interface FriendRequestsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
    open,
    onOpenChange,
}) => {
    const {
        friendRequests,
        fetchFriendRequests,
        acceptFriendRequest,
        rejectFriendRequest,
        loading,
    } = useContactStore();

    useEffect(() => {
        if (open) {
            fetchFriendRequests();
        }
    }, [open, fetchFriendRequests]);

    const handleAccept = async (requestId: string) => {
        try {
            await acceptFriendRequest(requestId);
            toast.success("Friend request accepted!");
        } catch (error) {
            console.error("Failed to accept friend request:", error);
            toast.error("Failed to accept friend request");
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await rejectFriendRequest(requestId);
            toast.success("Friend request rejected");
        } catch (error) {
            console.error("Failed to reject friend request:", error);
            toast.error("Failed to reject friend request");
        }
    };

    const { user: currentUser } = useAuthStore();

    const incomingRequests = friendRequests.filter(
        (req) => req.status === "pending" && req.toUserId === currentUser?.id
    );
    const outgoingRequests = friendRequests.filter(
        (req) => req.status === "pending" && req.fromUserId === currentUser?.id
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content size="md">
                <Dialog.Header>
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        <span>Friend Requests</span>
                        {incomingRequests.length > 0 && (
                            <Badge variant="solid" size="sm" className="bg-red-500 text-white">
                                {incomingRequests.length}
                            </Badge>
                        )}
                    </div>
                </Dialog.Header>

                <div className="flex flex-col gap-4 p-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-muted-foreground">Loading requests...</div>
                        </div>
                    ) : (
                        <>
                            {/* Incoming Requests */}
                            {incomingRequests.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-semibold text-sm">Incoming Requests</h3>
                                        <Badge variant="solid" size="sm" className="bg-red-500 text-white">
                                            {incomingRequests.length}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {incomingRequests.map((request) => {
                                            const user = request.fromUser;
                                            if (!user) return null;

                                            return (
                                                <div
                                                    key={request.id}
                                                    className="flex items-center gap-3 p-3 border-2 rounded bg-background"
                                                >
                                                    <Avatar className="h-12 w-12">
                                                        {user.profilePictureUrl ? (
                                                            <Avatar.Image
                                                                src={user.profilePictureUrl}
                                                                alt={user.displayName}
                                                            />
                                                        ) : (
                                                            <Avatar.Fallback>
                                                                {user.displayName.charAt(0).toUpperCase()}
                                                            </Avatar.Fallback>
                                                        )}
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm truncate">
                                                            {formatDisplayName(user.displayName)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            @{user.username}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleAccept(request.id)}
                                                            title="Accept"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleReject(request.id)}
                                                            title="Reject"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Outgoing Requests */}
                            {outgoingRequests.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-semibold text-sm">Sent Requests</h3>
                                        <Badge variant="outline" size="sm">
                                            {outgoingRequests.length}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {outgoingRequests.map((request) => {
                                            const user = request.toUser;
                                            if (!user) return null;

                                            return (
                                                <div
                                                    key={request.id}
                                                    className="flex items-center gap-3 p-3 border-2 rounded bg-muted/50"
                                                >
                                                    <Avatar className="h-12 w-12">
                                                        {user.profilePictureUrl ? (
                                                            <Avatar.Image
                                                                src={user.profilePictureUrl}
                                                                alt={user.displayName}
                                                            />
                                                        ) : (
                                                            <Avatar.Fallback>
                                                                {user.displayName.charAt(0).toUpperCase()}
                                                            </Avatar.Fallback>
                                                        )}
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm truncate">
                                                            {formatDisplayName(user.displayName)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            @{user.username}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-xs">Pending</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <Bell className="w-12 h-12 mb-3 opacity-50" />
                                    <p className="text-sm font-semibold">No pending friend requests</p>
                                    <p className="text-xs mt-2">
                                        Search for users to send friend requests!
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <Dialog.Footer>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
};
