import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { headers } from "next/headers";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function getSession(): Promise<Session | null> {
    try {
        const headersList = await headers();

        const { data: session } = await betterFetch<Session>(
            `${baseURL}/api/auth/get-session`,
            {
                method: "GET",
                headers: {
                    cookie: headersList.get("cookie") || "",
                },
            }
        );

        return session;
    } catch {
        return null;
    }
}
