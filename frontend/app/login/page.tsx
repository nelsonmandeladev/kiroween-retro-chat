import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
                <p className="text-gray-600 text-center mb-6">
                    Log in to RetroChat
                </p>

                <LoginForm />

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-600">Don&apos;t have an account? </span>
                    <Link
                        href="/register"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
