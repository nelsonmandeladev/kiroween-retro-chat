import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import ChatPageClient from "@/components/chat/ChatPageClient";

export default async function ChatPage() {
    const session = await getSession();

    console.log({ session })

    if (!session) {
        redirect("/login");
    }

    return <ChatPageClient />;
}
