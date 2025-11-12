import { useEffect } from "react";
import { socketService } from "./socket.service";
import { useAuthStore } from "../stores/auth-store";
import { useSession } from "../auth-client";

/**
 * Hook to manage WebSocket connection lifecycle
 * Automatically connects when user is authenticated and disconnects on unmount
 */
export function useSocket() {
    const { isAuthenticated, user } = useAuthStore();
    const { data: session } = useSession();

    console.log({ session })

    useEffect(() => {
        if (isAuthenticated && user && session?.session?.token) {
            // Connect with user session token
            socketService.connect(session.session.token);

            return () => {
                // Disconnect when component unmounts or user logs out
                socketService.disconnect();
            };
        }
    }, [isAuthenticated, user, session?.session?.token]);

    return {
        isConnected: socketService.isConnected(),
        sendMessage: socketService.sendMessage.bind(socketService),
        sendTyping: socketService.sendTyping.bind(socketService),
        sendGroupMessage: socketService.sendGroupMessage.bind(socketService),
        sendGroupTyping: socketService.sendGroupTyping.bind(socketService),
        mentionGroupAI: socketService.mentionGroupAI.bind(socketService),
    };
}
