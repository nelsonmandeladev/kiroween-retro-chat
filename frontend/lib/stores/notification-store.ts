import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

interface NotificationState {
    // Sound settings
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    audioUnlocked: boolean;
    unlockAudio: () => void;

    // Browser notification permission
    notificationPermission: NotificationPermission;
    requestNotificationPermission: () => Promise<void>;

    // Play notification sounds
    playMessageSound: () => void;
    playFriendRequestSound: () => void;
    playGroupInviteSound: () => void;

    // Show notifications
    showMessageNotification: (senderName: string, messagePreview: string) => void;
    showGroupMessageNotification: (
        groupName: string,
        senderName: string,
        messagePreview: string,
        hasMention?: boolean
    ) => void;
    showFriendRequestNotification: (senderName: string) => void;
    showGroupInviteNotification: (groupName: string) => void;
    showGroupActivityNotification: (
        type: "added" | "removed" | "deleted",
        groupName: string,
        actorName?: string
    ) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            soundEnabled: true,
            audioUnlocked: false,
            notificationPermission: typeof window !== "undefined" ? Notification.permission : "default",

            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

            unlockAudio: () => {
                // Play a silent audio to unlock audio context after user interaction
                if (typeof window !== "undefined" && !get().audioUnlocked) {
                    const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////////////////AAAAAAAAAAAAAAAAAAAAAP/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==");
                    silentAudio.volume = 0;
                    silentAudio.play().then(() => {
                        set({ audioUnlocked: true });
                    }).catch(() => {
                        // Silently fail - audio will remain locked
                    });
                }
            },

            requestNotificationPermission: async () => {
                if (typeof window === "undefined" || !("Notification" in window)) {
                    return;
                }

                const permission = await Notification.requestPermission();
                set({ notificationPermission: permission });
            },

            playMessageSound: () => {
                const state = get();
                if (state.soundEnabled && state.audioUnlocked) {
                    const audio = new Audio("/sounds/message.mp3");
                    audio.volume = 0.5;
                    audio.play().catch(() => {
                        // Silently fail if audio can't play
                    });
                }
            },

            playFriendRequestSound: () => {
                const state = get();
                if (state.soundEnabled && state.audioUnlocked) {
                    const audio = new Audio("/sounds/friend-request.mp3");
                    audio.volume = 0.5;
                    audio.play().catch(() => {
                        // Silently fail if audio can't play
                    });
                }
            },

            playGroupInviteSound: () => {
                const state = get();
                if (state.soundEnabled && state.audioUnlocked) {
                    const audio = new Audio("/sounds/group-invite.mp3");
                    audio.volume = 0.5;
                    audio.play().catch(() => {
                        // Silently fail if audio can't play
                    });
                }
            },

            showMessageNotification: (senderName, messagePreview) => {
                const { notificationPermission } = get();

                // Show toast notification
                toast.info(`${senderName}`, {
                    description: messagePreview,
                    duration: 4000,
                });

                // Show browser notification if permitted
                if (notificationPermission === "granted" && typeof window !== "undefined") {
                    new Notification(`New message from ${senderName}`, {
                        body: messagePreview,
                        icon: "/window.svg",
                        tag: `message-${senderName}`,
                    });
                }
            },

            showGroupMessageNotification: (groupName, senderName, messagePreview, hasMention = false) => {
                const { notificationPermission } = get();

                // Show toast notification with mention highlight
                toast.info(`${senderName} in ${groupName}`, {
                    description: messagePreview,
                    duration: hasMention ? 6000 : 4000,
                    className: hasMention ? "border-2 border-yellow-500" : undefined,
                });

                // Show browser notification if permitted
                if (notificationPermission === "granted" && typeof window !== "undefined") {
                    new Notification(
                        hasMention ? `${senderName} mentioned you in ${groupName}` : `${senderName} in ${groupName}`,
                        {
                            body: messagePreview,
                            icon: "/window.svg",
                            tag: `group-${groupName}`,
                        }
                    );
                }
            },

            showFriendRequestNotification: (senderName) => {
                const { notificationPermission } = get();

                // Show toast notification
                toast.success("New Friend Request", {
                    description: `${senderName} wants to be your friend`,
                    duration: 5000,
                });

                // Show browser notification if permitted
                if (notificationPermission === "granted" && typeof window !== "undefined") {
                    new Notification("New Friend Request", {
                        body: `${senderName} wants to be your friend`,
                        icon: "/window.svg",
                        tag: "friend-request",
                    });
                }
            },

            showGroupInviteNotification: (groupName) => {
                const { notificationPermission } = get();

                // Show toast notification
                toast.success("Group Invitation", {
                    description: `You've been added to ${groupName}`,
                    duration: 5000,
                });

                // Show browser notification if permitted
                if (notificationPermission === "granted" && typeof window !== "undefined") {
                    new Notification("Group Invitation", {
                        body: `You've been added to ${groupName}`,
                        icon: "/window.svg",
                        tag: "group-invite",
                    });
                }
            },

            showGroupActivityNotification: (type, groupName, actorName) => {
                const { notificationPermission } = get();

                let title = "";
                let description = "";

                switch (type) {
                    case "added":
                        title = "Added to Group";
                        description = actorName
                            ? `${actorName} added you to ${groupName}`
                            : `You've been added to ${groupName}`;
                        break;
                    case "removed":
                        title = "Removed from Group";
                        description = actorName
                            ? `${actorName} removed you from ${groupName}`
                            : `You've been removed from ${groupName}`;
                        break;
                    case "deleted":
                        title = "Group Deleted";
                        description = `${groupName} has been deleted`;
                        break;
                }

                // Show toast notification
                toast.info(title, {
                    description,
                    duration: 5000,
                });

                // Show browser notification if permitted
                if (notificationPermission === "granted" && typeof window !== "undefined") {
                    new Notification(title, {
                        body: description,
                        icon: "/window.svg",
                        tag: `group-activity-${groupName}`,
                    });
                }
            },
        }),
        {
            name: "notification-settings",
            partialize: (state) => ({ soundEnabled: state.soundEnabled }),
        }
    )
);
