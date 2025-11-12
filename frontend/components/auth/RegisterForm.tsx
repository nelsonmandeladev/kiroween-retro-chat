"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/retroui/Input";
import { Button } from "@/components/retroui/Button";
import { Alert } from "@/components/retroui/Alert";
import { FormField } from "@/components/forms/FormField";
import { validateEmail, validatePassword } from "@/lib/utils/validation";

const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be 50 characters or less"),
        email: z.string().email("Please enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const result = await signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
            });

            if (result.error) {
                setError("root", {
                    message: result.error.message || "Registration failed",
                });
            } else {
                router.push("/profile-setup");
            }
        } catch {
            setError("root", {
                message: "An unexpected error occurred",
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
            <FormField label="Full Name" htmlFor="name" error={errors.name?.message}>
                <Input
                    id="name"
                    type="text"
                    placeholder="Enter your Full Name"
                    aria-invalid={!!errors.name}
                    disabled={isSubmitting}
                    {...register("name")}
                />
            </FormField>

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
                    placeholder="Create a password"
                    aria-invalid={!!errors.password}
                    disabled={isSubmitting}
                    {...register("password")}
                />
            </FormField>

            <FormField
                label="Confirm Password"
                htmlFor="confirmPassword"
                error={errors.confirmPassword?.message}
            >
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    aria-invalid={!!errors.confirmPassword}
                    disabled={isSubmitting}
                    {...register("confirmPassword")}
                />
            </FormField>

            {errors.root && (
                <Alert status="error">
                    <Alert.Description>{errors.root.message}</Alert.Description>
                </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
        </form>
    );
}
