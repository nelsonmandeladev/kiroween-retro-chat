import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-2">Join RetroChat</h1>
                <p className="text-gray-600 text-center mb-6">
                    Create your account to start chatting
                </p>

                <RegisterForm />

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-600">Already have an account? </span>
                    <Link
                        href="/login"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
