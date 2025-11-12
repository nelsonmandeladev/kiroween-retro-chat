import { create } from "zustand";

interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    loading: true,
    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            loading: false,
        }),
    setLoading: (loading) => set({ loading }),
    logout: () =>
        set({
            user: null,
            isAuthenticated: false,
            loading: false,
        }),
}));
