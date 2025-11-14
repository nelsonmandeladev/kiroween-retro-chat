"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore, ConversationInfo } from "@/lib/stores/chat-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useGroupStore } from "@/lib/stores/group-store";
import { useContactStore } from "@/lib/stores/contact-store";
import { Message, GroupMessage } from "@/lib/api/types";
import { Avatar } from "@/components/retroui/Avatar";
import { Button } from "@/components/retroui/Button";
import { Loader } from "@/components/retroui/Loader";
import { socketService } from "@/lib/websocket/socket.service";
import { chatService } from "@/lib/api/chat.service";
import { groupsService } from "@/lib/api/groups.service";
import { EmoticonPicker, convertEmoticonsToEmoji } from "./EmoticonPicker";
import { GroupSettings } from "./GroupSettings";
import { AIFriendProfile } from "./AIFriendProfile";
import { GroupAIProfile } from "./GroupAIProfile";
import { AnimatedGhostIcon } from "@/components/ui/AnimatedGhostIcon";
import { formatDisplayName } from "@/lib/utils/display-name";
import { validateMessageContent } from "@/lib/utils/validation";
import { format } from "date-fns";
import { MessageHistorySkeleton } from "./MessageHistorySkeleton";
import { TypingIndicator } from "./TypingIndicator";
import { toast } from "sonner";

interface ChatWindowProps {
    conversation: ConversationInfo;
    onClose?: () => void;
}

export function ChatWindow({ conversation, onClose }: ChatWindowProps) {
    const { user } = useAuthStore();
    const { messages, typingUsers, setMessages, addMessage, prependMessages, markMessagesAsRead, resetUnreadCount } = useChatStore();
    const { getGroupById, isUserAdmin, groupMembers } = useGroupStore();
    const [messageInput, setMessageInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [showAIProfile, setShowAIProfile] = useState(false);
    const [showGroupAIProfile, setShowGroupAIProfile] = useState(false);
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousScrollHeight = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const conversationMessages = messages.get(conversation.id) || [];
    const typingUsersList = typingUsers.get(conversation.id) || [];

    const isGroupChat = conversation.type === "group";
    const isAIFriend = conversation.type === "ai-friend";

    // Get group-specific data
    const groupData = isGroupChat ? getGroupById(conversation.id) : null;
    const groupMembersList = isGroupChat ? groupMembers.get(conversation.id) || [] : [];
    const memberCount = groupMembersList.length;
    const isAdmin = isGroupChat && user ? isUserAdmin(conversation.id, user.id) : false;

    // AI Friend specific data
    const [aiFriendMessageCount, setAiFriendMessageCount] = useState<number>(0);
    const [isLoadingAIProfile, setIsLoadingAIProfile] = useState(false);
    const [isAIStreaming, setIsAIStreaming] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const hasMinimumAIData = aiFriendMessageCount >= 10;

    // Group AI specific data
    const [groupAIMessageCount, setGroupAIMessageCount] = useState<number>(0);
    const [isLoadingGroupAIProfile, setIsLoadingGroupAIProfile] = useState(false);
    const [isGroupAIStreaming, setIsGroupAIStreaming] = useState(false);
    const [groupAIError, setGroupAIError] = useState<string | null>(null);
    const hasMinimumGroupAIData = groupAIMessageCount >= 20;

    // Get mentionable members (exclude current user and filter by query)
    const mentionableMembers = groupMembersList
        .filter((member) => member.userId !== user?.id)
        .filter((member) => {
            if (!mentionQuery) return true;
            const displayName = member.user?.displayName?.toLowerCase() || "";
            const username = member.user?.username?.toLowerCase() || "";
            const query = mentionQuery.toLowerCase();
            return displayName.includes(query) || username.includes(query);
        })
        .slice(0, 5); // Limit to 5 suggestions

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load AI Friend profile to get message count
    useEffect(() => {
        const loadAIProfile = async () => {
            if (!isAIFriend) return;

            setIsLoadingAIProfile(true);
            try {
                const { aiFriendService } = await import("@/lib/api/ai-friend.service");
                const profile = await aiFriendService.getStyleProfile();
                setAiFriendMessageCount(profile.messageCount);
            } catch (error) {
                console.error("Failed to load AI Friend profile:", error);
                // Default to 0 if profile doesn't exist yet
                setAiFriendMessageCount(0);
            } finally {
                setIsLoadingAIProfile(false);
            }
        };

        loadAIProfile();
    }, [isAIFriend]);

    // Load Group AI profile to get message count
    const loadGroupAIProfile = useCallback(async () => {
        if (!isGroupChat) return;

        setIsLoadingGroupAIProfile(true);
        try {
            const profile = await groupsService.getAIProfile(conversation.id);
            setGroupAIMessageCount(profile.messageCount);
        } catch (error) {
            console.error("Failed to load Group AI profile:", error);
            // Default to 0 if profile doesn't exist yet
            setGroupAIMessageCount(0);
        } finally {
            setIsLoadingGroupAIProfile(false);
        }
    }, [isGroupChat, conversation.id]);

    useEffect(() => {
        loadGroupAIProfile();
    }, [loadGroupAIProfile]);

    // Load initial message history
    useEffect(() => {
        const loadInitialMessages = async () => {
            setIsLoadingHistory(true);
            setIsInitialLoad(true);

            try {
                if (isGroupChat) {
                    const response = await groupsService.getMessages(conversation.id, 50);
                    setMessages(conversation.id, response);
                    setHasMoreMessages(response.length === 50);
                } else if (!isAIFriend) {
                    const messages = await chatService.getConversation(conversation.id, 50);
                    setMessages(conversation.id, messages);
                    setHasMoreMessages(messages.length === 50);
                } else {
                    // AI Friend messages - load from conversation endpoint
                    const messages = await chatService.getConversation("kirhost", 50);
                    setMessages("ai-friend", messages);
                    setHasMoreMessages(messages.length === 50);
                }

                // Mark messages as read and reset unread counts in all stores
                markMessagesAsRead(conversation.id);
                resetUnreadCount(conversation.id);

                // Reset unread count in contact store for direct messages
                if (!isGroupChat && !isAIFriend) {
                    useContactStore.getState().resetUnreadCount(conversation.id);
                }

                // Reset unread count in group store for group messages
                if (isGroupChat) {
                    useGroupStore.getState().resetUnreadCount(conversation.id);
                }
            } catch (error) {
                console.error("Failed to load message history:", error);
            } finally {
                setIsLoadingHistory(false);
                setIsInitialLoad(false);
            }
        };

        loadInitialMessages();
    }, [conversation.id, conversation.type, isGroupChat, isAIFriend, setMessages, markMessagesAsRead, resetUnreadCount]);

    // Auto-scroll to bottom on initial load and new messages
    useEffect(() => {
        if (isInitialLoad || conversationMessages.length > 0) {
            scrollToBottom();
        }

        // Refresh group AI profile count when messages change
        if (isGroupChat && conversationMessages.length > 0 && !isInitialLoad) {
            loadGroupAIProfile();
        }
    }, [conversationMessages.length, isInitialLoad, isGroupChat, loadGroupAIProfile]);

    // Listen for AI Friend streaming events
    useEffect(() => {
        if (!isAIFriend) return;

        const handleStreamStart = () => {
            setIsAIStreaming(true);
            // Add a placeholder message for streaming
            const placeholderMessage: Message = {
                id: "streaming-placeholder",
                fromUserId: "ai-friend",
                toUserId: user?.id || "",
                content: "",
                timestamp: new Date().toISOString(),
                isRead: true,
                isAIGenerated: true,
            };
            addMessage("ai-friend", placeholderMessage);
        };

        const handleStreamEnd = () => {
            setIsAIStreaming(false);
            setAiError(null); // Clear any previous errors
        };

        const handleStreamError = (event: Event) => {
            const customEvent = event as CustomEvent;
            setIsAIStreaming(false);
            setAiError(customEvent.detail?.error || "Kirhost is temporarily unavailable. Please try again.");
            // Remove placeholder message
            const messages = useChatStore.getState().messages.get("ai-friend") || [];
            const filtered = messages.filter((m) => m.id !== "streaming-placeholder" && m.id !== "streaming-temp");
            useChatStore.getState().setMessages("ai-friend", filtered);
        };

        // Subscribe to streaming events via custom events
        window.addEventListener("ai-friend:stream-start", handleStreamStart as EventListener);
        window.addEventListener("ai-friend:stream-end", handleStreamEnd as EventListener);
        window.addEventListener("ai-friend:stream-error", handleStreamError as EventListener);

        return () => {
            window.removeEventListener("ai-friend:stream-start", handleStreamStart as EventListener);
            window.removeEventListener("ai-friend:stream-end", handleStreamEnd as EventListener);
            window.removeEventListener("ai-friend:stream-error", handleStreamError as EventListener);
        };
    }, [isAIFriend, user?.id, addMessage]);

    // Listen for Group AI streaming events
    useEffect(() => {
        if (!isGroupChat) return;

        const handleGroupAIStreamStart = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.groupId === conversation.id) {
                setIsGroupAIStreaming(true);
                // Add a placeholder message for streaming
                const placeholderMessage: GroupMessage = {
                    id: "group-ai-streaming-placeholder",
                    groupId: conversation.id,
                    fromUserId: `group-ai-${conversation.id}`,
                    content: "",
                    timestamp: new Date().toISOString(),
                    isAIGenerated: true,
                    mentionedUserIds: [],
                };
                addMessage(conversation.id, placeholderMessage);
            }
        };

        const handleGroupAIStreamEnd = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.groupId === conversation.id) {
                setIsGroupAIStreaming(false);
                setGroupAIError(null); // Clear any previous errors
                // Refresh message count from backend
                loadGroupAIProfile();
            }
        };

        const handleGroupAIStreamError = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.groupId === conversation.id) {
                setIsGroupAIStreaming(false);
                setGroupAIError(customEvent.detail?.error || "Group AI is temporarily unavailable. Please try again.");
                // Remove placeholder message
                const messages = useChatStore.getState().messages.get(conversation.id) || [];
                const filtered = messages.filter((m) => m.id !== "group-ai-streaming-placeholder" && m.id !== "group-ai-streaming-temp");
                useChatStore.getState().setMessages(conversation.id, filtered);
            }
        };

        // Subscribe to streaming events via custom events
        window.addEventListener("group:ai:stream-start", handleGroupAIStreamStart as EventListener);
        window.addEventListener("group:ai:stream-end", handleGroupAIStreamEnd as EventListener);
        window.addEventListener("group:ai:stream-error", handleGroupAIStreamError as EventListener);

        return () => {
            window.removeEventListener("group:ai:stream-start", handleGroupAIStreamStart as EventListener);
            window.removeEventListener("group:ai:stream-end", handleGroupAIStreamEnd as EventListener);
            window.removeEventListener("group:ai:stream-error", handleGroupAIStreamError as EventListener);
        };
    }, [isGroupChat, conversation.id, addMessage, loadGroupAIProfile]);

    // Load more messages when scrolling to top
    const handleScroll = useCallback(async () => {
        const container = messagesContainerRef.current;
        if (!container || isLoadingHistory || !hasMoreMessages) return;

        // Check if scrolled to top (within 100px)
        if (container.scrollTop < 100) {
            setIsLoadingHistory(true);
            previousScrollHeight.current = container.scrollHeight;

            try {
                const oldestMessage = conversationMessages[0];
                if (!oldestMessage) return;

                if (isGroupChat) {
                    const response = await groupsService.getMessages(
                        conversation.id,
                        50,
                        oldestMessage.id
                    );
                    prependMessages(conversation.id, response);
                    setHasMoreMessages(response.length === 50);
                } else if (!isAIFriend) {
                    // For direct messages, we need to implement pagination
                    // For now, just mark as no more messages
                    setHasMoreMessages(false);
                }

                // Restore scroll position
                setTimeout(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - previousScrollHeight.current;
                    }
                }, 0);
            } catch (error) {
                console.error("Failed to load more messages:", error);
            } finally {
                setIsLoadingHistory(false);
            }
        }
    }, [conversation.id, conversationMessages, isLoadingHistory, hasMoreMessages, isGroupChat, isAIFriend, prependMessages]);

    const formatTimestamp = (timestamp: string) => {
        return format(new Date(timestamp), "HH:mm");
    };

    // Highlight mentions in message content
    const highlightMentions = (content: string, mentionedUserIds: string[]) => {
        if (!isGroupChat || mentionedUserIds.length === 0) {
            return convertEmoticonsToEmoji(content);
        }

        // Find all @mentions in the content
        const mentionRegex = /@(\w+)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(convertEmoticonsToEmoji(content.substring(lastIndex, match.index)));
            }

            // Check if this mention is for the current user
            const mentionText = match[0];
            const isCurrentUserMentioned = user && mentionedUserIds.includes(user.id);

            // Add highlighted mention
            parts.push(
                <span
                    key={match.index}
                    className={`font-semibold ${isCurrentUserMentioned ? "bg-yellow-200 px-1 rounded" : "text-blue-600"
                        }`}
                >
                    {mentionText}
                </span>
            );

            lastIndex = match.index + mentionText.length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(convertEmoticonsToEmoji(content.substring(lastIndex)));
        }

        return parts.length > 0 ? parts : convertEmoticonsToEmoji(content);
    };

    // Handle mention detection
    const handleInputChange = (value: string) => {
        setMessageInput(value);

        // Only check for mentions in group chats
        if (!isGroupChat) {
            handleTyping();
            return;
        }

        // Get cursor position
        const cursorPos = inputRef.current?.selectionStart || value.length;

        // Find the last @ before cursor
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            // Check if there's a space between @ and cursor
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            if (!textAfterAt.includes(" ")) {
                // We're in a mention
                setMentionStartPos(lastAtIndex);
                setMentionQuery(textAfterAt);
                setShowMentionSuggestions(true);
            } else {
                setShowMentionSuggestions(false);
            }
        } else {
            setShowMentionSuggestions(false);
        }

        handleTyping();
    };

    // Handle mention selection
    const handleMentionSelect = (displayName: string) => {
        if (mentionStartPos === null) return;

        const beforeMention = messageInput.substring(0, mentionStartPos);
        const afterMention = messageInput.substring(mentionStartPos + mentionQuery.length + 1);
        const newValue = `${beforeMention}@${displayName} ${afterMention}`;

        setMessageInput(newValue);
        setShowMentionSuggestions(false);
        setMentionStartPos(null);
        setMentionQuery("");

        // Focus back on input
        inputRef.current?.focus();
    };

    // Handle typing indicator
    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);

            // Emit typing event
            if (isGroupChat) {
                socketService.sendGroupTyping(conversation.id);
            } else if (!isAIFriend) {
                socketService.sendTyping(conversation.id);
            }
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);
    };

    // Handle message sending
    const handleSendMessage = () => {
        const content = messageInput.trim();
        if (!content || !user) return;

        // Validate message content
        const validation = validateMessageContent(content);
        if (!validation.isValid) {
            toast.error("Invalid message", {
                description: validation.error,
                duration: 3000,
            });
            return;
        }

        // Send message via WebSocket
        if (isGroupChat) {
            // Add optimistic message immediately
            const optimisticMessage: GroupMessage = {
                id: `temp-${Date.now()}`,
                groupId: conversation.id,
                fromUserId: user.id,
                content,
                timestamp: new Date().toISOString(),
                isAIGenerated: false,
                mentionedUserIds: [],
                isPending: true,
            };
            addMessage(conversation.id, optimisticMessage);

            // Check if Group AI is mentioned
            const aiMember = groupMembersList.find((m) => m.userId.startsWith("group-ai-"));
            const isAIMentioned = aiMember?.user && (
                content.includes(`@${aiMember.user.displayName}`) ||
                content.includes("@AI") ||
                content.toLowerCase().includes("@ai")
            );

            // Send regular group message first
            socketService.sendGroupMessage(conversation.id, content);

            // If AI is mentioned and has minimum data, trigger AI response
            if (isAIMentioned) {
                if (hasMinimumGroupAIData && groupData?.aiEnabled) {
                    // Trigger Group AI response via WebSocket
                    socketService.mentionGroupAI(conversation.id, content);
                } else if (!hasMinimumGroupAIData) {
                    // Show "AI is learning" message
                    setGroupAIError(`Group AI is still learning. ${groupAIMessageCount}/20 messages needed.`);
                    setTimeout(() => setGroupAIError(null), 5000);
                } else if (!groupData?.aiEnabled) {
                    setGroupAIError("Group AI is disabled. Ask an admin to enable it.");
                    setTimeout(() => setGroupAIError(null), 5000);
                }
            }

            // Refresh message count from backend
            loadGroupAIProfile();
        } else if (isAIFriend) {
            // Add optimistic message immediately for AI Friend
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                fromUserId: user.id,
                toUserId: "kirhost",
                content,
                timestamp: new Date().toISOString(),
                isRead: false,
                isAIGenerated: false,
                isPending: true,
            };
            addMessage("ai-friend", optimisticMessage);

            // For AI Friend, send via special WebSocket event
            socketService.sendAIFriendMessage(content);
            // Increment message count for learning progress
            setAiFriendMessageCount((prev) => prev + 1);
        } else {
            // Add optimistic message immediately for direct messages
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                fromUserId: user.id,
                toUserId: conversation.id,
                content,
                timestamp: new Date().toISOString(),
                isRead: false,
                isAIGenerated: false,
                isPending: true,
            };
            addMessage(conversation.id, optimisticMessage);

            socketService.sendMessage(conversation.id, content);
        }

        // Clear input
        setMessageInput("");
        setIsTyping(false);

        // Clear typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const renderMessage = (message: Message | GroupMessage, index: number) => {
        const isOwnMessage = message.fromUserId === user?.id;
        const isAI = message.isAIGenerated;

        // For group messages, show sender name
        const senderName = isGroupChat && "fromUser" in message
            ? message.fromUser?.displayName || "Unknown"
            : null;

        // Check if this is a Group AI member
        const isGroupAI = isAI && isGroupChat;

        return (
            <div
                key={message.id || index}
                className={`flex gap-2 mb-3 message-fade-in ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
            >
                {/* Avatar */}
                {!isOwnMessage && (
                    <Avatar className="w-8 h-8 shrink-0">
                        <Avatar.Image
                            src={
                                isGroupChat && "fromUser" in message
                                    ? message.fromUser?.profilePictureUrl || undefined
                                    : conversation.avatarUrl
                            }
                            alt={senderName || conversation.name}
                        />
                        <Avatar.Fallback>
                            {isGroupAI ? "🤖" : (senderName || conversation.name).charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar>
                )}

                {/* Message bubble */}
                <div
                    className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}
                >
                    {/* Sender name for group chats */}
                    {isGroupChat && !isOwnMessage && senderName && (
                        <div className="flex items-center gap-1 mb-1 px-2">
                            <span className={`text-xs font-semibold ${isGroupAI ? "text-purple-600" : "text-gray-700"}`}>
                                {formatDisplayName(senderName)}
                            </span>
                            {isGroupAI && (
                                <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">
                                    AI
                                </span>
                            )}
                        </div>
                    )}

                    {/* Message content */}
                    <div
                        className={`message-bubble-enter ${isOwnMessage
                            ? "msn-message-sent"
                            : isGroupAI || (isAI && isAIFriend)
                                ? "msn-message-ai"
                                : "msn-message-received"
                            }`}
                    >
                        {/* AI Friend indicator */}
                        {isAI && isAIFriend && !isOwnMessage && (
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AnimatedGhostIcon width={12} height={14} /> Kirhost
                                </span>
                                {isAIStreaming && message.id === "streaming-placeholder" && (
                                    <span className="text-xs text-purple-600 italic">typing...</span>
                                )}
                            </div>
                        )}
                        {/* Group AI typing indicator */}
                        {isGroupAI && isGroupAIStreaming && message.id === "group-ai-streaming-placeholder" && (
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs text-purple-600 italic">Group AI is typing...</span>
                            </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap wrap-break-word">
                            {"mentionedUserIds" in message
                                ? highlightMentions(message.content, message.mentionedUserIds)
                                : convertEmoticonsToEmoji(message.content)}
                            {/* Streaming cursor animation for AI Friend */}
                            {isAI && isAIFriend && isAIStreaming && (message.id === "streaming-temp" || message.id === "streaming-placeholder") && (
                                <span className="ai-cursor ml-1 bg-purple-600" />
                            )}
                            {/* Streaming cursor animation for Group AI */}
                            {isGroupAI && isGroupAIStreaming && (message.id === "group-ai-streaming-temp" || message.id === "group-ai-streaming-placeholder") && (
                                <span className="ai-cursor ml-1 bg-purple-600" />
                            )}
                        </p>
                    </div>

                    {/* Timestamp and status */}
                    <span className="text-xs text-gray-500 mt-1 px-2 flex items-center gap-1">
                        {formatTimestamp(message.timestamp)}
                        {message.isPending && (
                            <span className="text-xs text-gray-400 italic">• sending...</span>
                        )}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full msn-window">
            {/* Header */}
            <div className="flex items-center justify-between msn-window-header">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <Avatar.Image
                            src={conversation.avatarUrl}
                            alt={conversation.name}
                        />
                        <Avatar.Fallback>
                            {conversation.name.charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar>
                    <div>
                        <h2 className="text-white font-bold text-lg">
                            {conversation.name}
                        </h2>
                        {isGroupChat && (
                            <p className="text-blue-100 text-xs">
                                {memberCount} {memberCount === 1 ? "member" : "members"}
                            </p>
                        )}
                        {isAIFriend && (
                            <div className="flex items-center gap-2">
                                <AnimatedGhostIcon width={16} height={20} />
                                <p className="text-blue-100 text-xs">
                                    Kirhost
                                </p>
                                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                                    🤖 AI
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* AI Friend profile button */}
                    {isAIFriend && (
                        <Button
                            onClick={() => setShowAIProfile(true)}
                            variant="link"
                            className="text-white hover:bg-blue-700"
                            title="View Kirhost Profile"
                        >
                            📊
                        </Button>
                    )}

                    {/* Group AI profile button */}
                    {isGroupChat && (
                        <Button
                            onClick={() => setShowGroupAIProfile(true)}
                            variant="link"
                            className="text-white hover:bg-blue-700"
                            title="View Group AI Profile"
                        >
                            🤖
                        </Button>
                    )}

                    {/* Group settings button (admin only) */}
                    {isGroupChat && isAdmin && (
                        <Button
                            onClick={() => setShowGroupSettings(true)}
                            variant="link"
                            className="text-white hover:bg-blue-700"
                            title="Group Settings"
                        >
                            ⚙️
                        </Button>
                    )}

                    {onClose && (
                        <Button
                            onClick={onClose}
                            variant="link"
                            className="text-white hover:bg-blue-700"
                        >
                            ✕
                        </Button>
                    )}
                </div>
            </div>

            {/* Kirhost Learning Status Banner */}
            {isAIFriend && !isLoadingAIProfile && !hasMinimumAIData && (
                <div className="px-4 py-3 bg-purple-50 border-b-4 border-purple-200 flex items-center gap-3">
                    <AnimatedGhostIcon width={24} height={28} />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900">
                            Kirhost is Learning Your Style
                        </p>
                        <p className="text-xs text-purple-700">
                            {aiFriendMessageCount} / 10 messages sent. Keep chatting to help Kirhost learn your unique style!
                        </p>
                    </div>
                </div>
            )}

            {/* Kirhost Error Banner */}
            {isAIFriend && aiError && (
                <div className="px-4 py-3 bg-red-50 border-b-4 border-red-200 flex items-center gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">
                            Error
                        </p>
                        <p className="text-xs text-red-700">
                            {aiError}
                        </p>
                    </div>
                    <Button
                        onClick={() => setAiError(null)}
                        variant="link"
                        className="text-red-700 hover:text-red-900"
                    >
                        ✕
                    </Button>
                </div>
            )}

            {/* Group AI Learning Status Banner */}
            {isGroupChat && !isLoadingGroupAIProfile && !hasMinimumGroupAIData && groupData?.aiEnabled && (
                <div className="px-4 py-3 bg-purple-50 border-b-4 border-purple-200 flex items-center gap-3">
                    <div className="text-2xl">🤖</div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900">
                            Group AI is Learning
                        </p>
                        <p className="text-xs text-purple-700">
                            {groupAIMessageCount} / 20 messages sent. Keep chatting to help Group AI learn your group&apos;s style! Mention @AI to interact.
                        </p>
                    </div>
                </div>
            )}

            {/* Group AI Error Banner */}
            {isGroupChat && groupAIError && (
                <div className="px-4 py-3 bg-red-50 border-b-4 border-red-200 flex items-center gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">
                            Group AI
                        </p>
                        <p className="text-xs text-red-700">
                            {groupAIError}
                        </p>
                    </div>
                    <Button
                        onClick={() => setGroupAIError(null)}
                        variant="link"
                        className="text-red-700 hover:text-red-900"
                    >
                        ✕
                    </Button>
                </div>
            )}

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-white msn-scrollbar smooth-scroll"
                onScroll={handleScroll}
            >
                {/* Loading indicator for older messages */}
                {isLoadingHistory && hasMoreMessages && (
                    <div className="flex justify-center py-2">
                        <Loader size="sm" />
                    </div>
                )}

                {/* Initial loading state */}
                {isInitialLoad ? (
                    <MessageHistorySkeleton count={6} />
                ) : conversationMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <>
                        {conversationMessages.map((message, index) =>
                            renderMessage(message, index)
                        )}
                    </>
                )}

                {/* Typing indicator */}
                {typingUsersList.length > 0 && (
                    <TypingIndicator
                        usernames={typingUsersList.map((u) => u.username)}
                        variant="default"
                    />
                )}

                {/* AI streaming indicator */}
                {(isAIStreaming || isGroupAIStreaming) && (
                    <TypingIndicator variant="ai" />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 bg-(--msn-window-bg) border-t-2 border-border relative">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={messageInput}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={isGroupChat ? "Type a message... (use @ to mention)" : "Type a message..."}
                            className="msn-input px-4 py-2 w-full"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (showMentionSuggestions && mentionableMembers.length > 0) {
                                        // Select first suggestion
                                        const firstMember = mentionableMembers[0];
                                        if (firstMember.user) {
                                            handleMentionSelect(firstMember.user.displayName);
                                        }
                                    } else {
                                        handleSendMessage();
                                    }
                                } else if (e.key === "Escape" && showMentionSuggestions) {
                                    setShowMentionSuggestions(false);
                                }
                            }}
                        />

                        {/* Mention suggestions dropdown */}
                        {isGroupChat && showMentionSuggestions && mentionableMembers.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-2 w-full msn-window overflow-hidden z-50">
                                {mentionableMembers.map((member) => {
                                    const isGroupAI = member.userId.startsWith("group-ai-");
                                    return (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => {
                                                if (member.user) {
                                                    handleMentionSelect(member.user.displayName);
                                                }
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#e8f4ff] transition-colors text-left border-b border-border"
                                        >
                                            <Avatar className="w-8 h-8">
                                                {member.user?.profilePictureUrl ? (
                                                    <Avatar.Image
                                                        src={member.user.profilePictureUrl}
                                                        alt={member.user.displayName}
                                                    />
                                                ) : (
                                                    <Avatar.Fallback>
                                                        {isGroupAI ? "🤖" : member.user?.displayName.charAt(0).toUpperCase()}
                                                    </Avatar.Fallback>
                                                )}
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm truncate">
                                                        {member.user?.displayName}
                                                    </span>
                                                    {isGroupAI && (
                                                        <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">
                                                            AI
                                                        </span>
                                                    )}
                                                </div>
                                                {member.user?.username && (
                                                    <div className="text-xs text-gray-500 truncate">
                                                        @{member.user.username}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {isGroupChat && (
                        <button
                            onClick={() => {
                                // Add @AI mention
                                const aiMember = groupMembersList.find((m) => m.userId.startsWith("group-ai-"));
                                if (aiMember?.user) {
                                    setMessageInput((prev) => prev + `@${aiMember.user!.displayName} `);
                                    inputRef.current?.focus();
                                }
                            }}
                            className="msn-button px-4"
                            type="button"
                            title="Mention Group AI"
                        >
                            @AI
                        </button>
                    )}

                    <button
                        onClick={() => setShowEmoticonPicker(!showEmoticonPicker)}
                        className="msn-button px-4"
                        type="button"
                    >
                        😊
                    </button>
                    <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="msn-button-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>

                {/* Emoticon picker */}
                {showEmoticonPicker && (
                    <EmoticonPicker
                        onSelect={(emoticon) => {
                            setMessageInput((prev) => prev + emoticon);
                        }}
                        onClose={() => setShowEmoticonPicker(false)}
                    />
                )}
            </div>

            {/* Group Settings Modal */}
            {isGroupChat && showGroupSettings && groupData && (
                <GroupSettings
                    groupId={conversation.id}
                    open={showGroupSettings}
                    onOpenChange={setShowGroupSettings}
                    onGroupDeleted={() => {
                        setShowGroupSettings(false);
                        onClose?.();
                    }}
                    onLeftGroup={() => {
                        setShowGroupSettings(false);
                        onClose?.();
                    }}
                />
            )}

            {/* Kirhost Profile Modal */}
            {isAIFriend && showAIProfile && (
                <AIFriendProfile
                    open={showAIProfile}
                    onOpenChange={setShowAIProfile}
                />
            )}

            {/* Group AI Profile Modal */}
            {isGroupChat && showGroupAIProfile && (
                <GroupAIProfile
                    groupId={conversation.id}
                    open={showGroupAIProfile}
                    onOpenChange={setShowGroupAIProfile}
                />
            )}
        </div>
    );
}
