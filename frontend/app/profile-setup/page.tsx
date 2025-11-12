import { redirect } from "next/navigation";
import { ProfileSetup } from "@/components/auth/ProfileSetup";
import { getSession } from "@/lib/auth-client";

export default async function ProfileSetupPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Set Up Your Profile
                </h1>
                <p className="text-gray-600 text-center mb-6">
                    Tell us a bit about yourself
                </p>

                <ProfileSetup />
            </div>
        </div>
    );
}
