"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Button } from "@/components/retroui/Button";
import { Avatar } from "@/components/retroui/Avatar";
import { profileService } from "@/lib/api/profile.service";
import { useContactStore } from "@/lib/stores/contact-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { UserProfile } from "@/lib/api/types";
import { formatDisplayName } from "@/lib/utils/display-name";
import { Search, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";

interface UserSearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
    open,
    onOpenChange,
}) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const { sendFriendRequest, friends } = useContactStore();
    const { user: currentUser } = useAuthStore();

    const handleSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const users = await profileService.searchUsers(query);
            // Filter out the current user from results
            const filteredUsers = users.filter(user => user.id !== currentUser?.id);
            setResults(filteredUsers);
        } catch (error) {
            console.error("Failed to search users:", error);
            toast.error("Failed to search users");
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (userId: string) => {
        try {
            await sendFriendRequest(userId);
            setSentRequests((prev) => new Set(prev).add(userId));
            toast.success("Friend request sent!");
        } catch (error) {
            console.error("Failed to send friend request:", error);
            toast.error("Failed to send friend request");
        }
    };

    const isAlreadyFriend = (userId: string) => {
        return friends.has(userId);
    };

    const hasRequestSent = (userId: string) => {
        return sentRequests.has(userId);
    };

    const handleClose = () => {
        setQuery("");
        setResults([]);
        setSentRequests(new Set());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Content size="md">
                <Dialog.Header>
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        <span>Add Friends</span>
                    </div>
                </Dialog.Header>

                <div className="flex flex-col gap-4 p-4 max-h-[60vh] overflow-y-auto">
                    {/* Search Input */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search by username or email..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSearch();
                                    }
                                }}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading || !query.trim()}
                            size="md"
                        >
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Search Results */}
                    {loading && (
                        <div className="text-center text-muted-foreground py-8">
                            Searching...
                        </div>
                    )}

                    {!loading && results.length === 0 && query && (
                        <div className="text-center text-muted-foreground py-8">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-semibold">No users found</p>
                            <p className="text-xs mt-1">Try a different search term</p>
                        </div>
                    )}

                    {!loading && results.length === 0 && !query && (
                        <div className="text-center text-muted-foreground py-8">
                            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-semibold">Search for friends</p>
                            <p className="text-xs mt-1">Enter a username or email to find users</p>
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {results.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 border-2 rounded bg-background hover:bg-muted transition-colors"
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
                                    {isAlreadyFriend(user.id) ? (
                                        <Button size="sm" variant="outline" disabled>
                                            <Check className="w-4 h-4 mr-1" />
                                            Friends
                                        </Button>
                                    ) : hasRequestSent(user.id) ? (
                                        <Button size="sm" variant="outline" disabled>
                                            Request Sent
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => handleSendRequest(user.id)}
                                            variant="default"
                                        >
                                            <UserPlus className="w-4 h-4 mr-1" />
                                            Add Friend
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Dialog.Footer>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog>
    );
};
