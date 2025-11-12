"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/retroui/Input";
import { Button } from "@/components/retroui/Button";
import { Alert } from "@/components/retroui/Alert";
import { FormField } from "@/components/forms/FormField";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await signIn.email({
                email: data.email,
                password: data.password,
                rememberMe: true,
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/chat");
                    },
                    onError: (ctx) => {
                        setError("root", {
                            message: ctx.error.message || "Login failed",
                        });
                    },
                },
            });
        } catch {
            setError("root", {
                message: "An unexpected error occurred",
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    aria-invalid={!!errors.email}
                    disabled={isSubmitting}
                    {...register("email")}
                />
            </FormField>

            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
                <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    disabled={isSubmitting}
                    {...register("password")}
                />
            </FormField>

            {errors.root && (
                <Alert status="error">
                    <Alert.Description>{errors.root.message}</Alert.Description>
                </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Logging in..." : "Log In"}
            </Button>
        </form>
    );
}
