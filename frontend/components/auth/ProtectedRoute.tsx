"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        if (isPending) {
            setLoading(true);
            return;
        }

        if (!session) {
            setLoading(false);
            router.push("/login");
            return;
        }

        setUser({
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined,
        });
        setLoading(false);
    }, [session, isPending, router, setUser, setLoading]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#ECE9D8]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto"></div>
                    <p className="mt-4 text-[#000080]">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return <>{children}</>;
}
