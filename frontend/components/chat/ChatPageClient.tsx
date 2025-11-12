"use client";

import { ContactList } from "@/components/chat/ContactList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { UserSearchModal } from "@/components/chat/UserSearch";
import { FriendRequestsModal } from "@/components/chat/FriendRequests";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { GroupMemberList } from "@/components/chat/GroupMemberList";
import { useChatStore } from "@/lib/stores/chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useContactStore } from "@/lib/stores/contact-store";
import { useGroupStore } from "@/lib/stores/group-store";
import { useSocket } from "@/lib/websocket";
import { Button } from "@/components/retroui/Button";
import { useState, useEffect } from "react";
import { Users, UserPlus, Bell, LogOut } from "lucide-react";
import { AnimatedGhostIcon } from "@/components/ui/AnimatedGhostIcon";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function ChatPageClient() {
    const { activeChat } = useChatStore();
    const { user, logout, setUser } = useAuthStore();
    const { data: session } = useSession();
    const { fetchFriends, fetchFriendRequests, friendRequests, loading: contactsLoading } = useContactStore();
    const { fetchUserGroups, loading: groupsLoading } = useGroupStore();

    // Initialize WebSocket connection
    useSocket();

    const [showUserSearch, setShowUserSearch] = useState(false);
    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const router = useRouter();

    // Sync session to auth store
    useEffect(() => {
        if (session?.user) {
            setUser({
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image || undefined,
            });
        }
    }, [session, setUser]);

    // Load friends, friend requests, and groups on mount
    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchFriends(),
                fetchFriendRequests(),
                fetchUserGroups(),
            ]);
            setIsInitialLoad(false);
        };
        loadData();
    }, [fetchFriends, fetchFriendRequests, fetchUserGroups]);

    const handleLogout = async () => {
        signOut({
            fetchOptions: {
                onSuccess: () => {
                    logout();
                    router.push("/login"); // redirect to login page
                },
            },
        });
    };

    // Determine if we should show group members panel
    const showGroupMembers = activeChat?.type === "group";

    return (
        <div className="h-screen flex flex-col bg-(--msn-bg)">
            {/* Top Header Bar */}
            <div className="msn-window-header flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-white font-bold text-xl">RetroChat</h1>
                    {user && (
                        <div className="text-blue-100 text-sm">
                            Welcome, {user.name}!
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowFriendRequests(true)}
                        variant="link"
                        className="text-white hover:bg-blue-700 relative"
                        title="Friend Requests"
                    >
                        <Bell className="w-5 h-5" />
                        {friendRequests.filter(req => req.status === "pending" && req.toUserId === user?.id).length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {friendRequests.filter(req => req.status === "pending" && req.toUserId === user?.id).length}
                            </span>
                        )}
                    </Button>
                    <Button
                        onClick={() => setShowUserSearch(true)}
                        variant="link"
                        className="text-white hover:bg-blue-700"
                        title="Add Friends"
                    >
                        <UserPlus className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={() => setShowCreateGroup(true)}
                        variant="link"
                        className="text-white hover:bg-blue-700"
                        title="Create Group"
                    >
                        <Users className="w-5 h-5" />
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="link"
                        className="text-white hover:bg-blue-700"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Contact List */}
                <div className="w-80 border-r-4 border-border flex flex-col bg-white">
                    <ContactList
                        isLoading={isInitialLoad && (contactsLoading || groupsLoading)}
                        onContactClick={(userId, type) => {
                            useChatStore.getState().setActiveChat({
                                id: userId,
                                type: type,
                                name: type === "ai-friend" ? "Kirhost" : "",
                                avatarUrl: "",
                                unreadCount: 0,
                            });
                        }}
                        onGroupClick={(groupId) => {
                            useChatStore.getState().setActiveChat({
                                id: groupId,
                                type: "group",
                                name: "",
                                avatarUrl: "",
                                unreadCount: 0,
                            });
                        }}
                    />
                </div>

                {/* Center - Chat Window */}
                <div className="flex-1 flex flex-col">
                    {/* Main Chat Area */}
                    {activeChat ? (
                        <div className="chat-window-enter h-full">
                            <ChatWindow
                                conversation={activeChat}
                                onClose={() => {
                                    useChatStore.getState().setActiveChat(null);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-white">
                            <div className="text-center text-gray-400 flex flex-col items-center justify-center gap-3.5">
                                <div className="bg-black/20 size-40 flex items-center justify-center rounded-full">
                                    <div className="">
                                        <AnimatedGhostIcon />

                                        <AnimatedGhostIcon width={40} height={48} />

                                        <AnimatedGhostIcon />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold ">
                                        Welcome to RetroChat!
                                    </p>
                                    <p className="text-sm">
                                        Select a contact or group to start chatting
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Group Members (when in group chat) */}
                {showGroupMembers && activeChat && (
                    <div className="w-64 border-l-4 border-border">
                        <GroupMemberList groupId={activeChat.id} />
                    </div>
                )}
            </div>

            {/* User Search Modal */}
            <UserSearchModal
                open={showUserSearch}
                onOpenChange={setShowUserSearch}
            />

            {/* Friend Requests Modal */}
            <FriendRequestsModal
                open={showFriendRequests}
                onOpenChange={setShowFriendRequests}
            />

            {/* Create Group Modal */}
            <CreateGroupModal
                open={showCreateGroup}
                onOpenChange={setShowCreateGroup}
            />
        </div>
    );
}
