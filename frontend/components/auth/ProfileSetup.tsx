"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { profileService } from "@/lib/api";
import { Input } from "@/components/retroui/Input";
import { Button } from "@/components/retroui/Button";
import { Label } from "@/components/retroui/Label";
import { Alert } from "@/components/retroui/Alert";
import { FormField } from "@/components/forms/FormField";
import { validateDisplayName, formatDisplayName } from "@/lib/utils/display-name";
import {
    validateUsername,
    validateStatusMessage,
    validateFileUpload,
    sanitizeDisplayName
} from "@/lib/utils/validation";

const profileSetupSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be 20 characters or less")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    displayName: z
        .string()
        .min(2, "Display name must be at least 2 characters")
        .max(50, "Display name must be 50 characters or less")
        .refine((val: string) => {
            const error = validateDisplayName(val);
            return error === null;
        }, {
            message: "Display name contains invalid characters",
        }),
    statusMessage: z
        .string()
        .max(100, "Status message must be 100 characters or less")
        .optional(),
});

type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export function ProfileSetup() {
    const router = useRouter();
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [fileError, setFileError] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ProfileSetupFormData>({
        resolver: zodResolver(profileSetupSchema),
    });

    const displayNameValue = watch("displayName") || "";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file using validation utility
            const validation = validateFileUpload(file);
            if (!validation.isValid) {
                setFileError(validation.error || "Invalid file");
                return;
            }

            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
            setFileError("");
        }
    };

    const onSubmit = async (data: ProfileSetupFormData) => {
        try {
            // Upload profile picture first if provided
            if (profilePicture) {
                await profileService.uploadProfilePicture(profilePicture);
            }

            // Setup profile with username, display name, and status message
            await profileService.setupProfile({
                username: data.username,
                displayName: data.displayName,
                statusMessage: data.statusMessage || undefined,
            });

            router.push("/chat");
        } catch (err) {
            setError("root", {
                message:
                    err instanceof Error ? err.message : "An unexpected error occurred",
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md">
            <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 border-2 border-black">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Profile preview"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    )}
                </div>
                <Label
                    htmlFor="profilePicture"
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-medium border-2 border-black"
                >
                    Upload Photo
                </Label>
                <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                />
                {fileError && (
                    <p className="text-sm text-destructive mt-2">{fileError}</p>
                )}
            </div>

            <FormField
                label="Username"
                htmlFor="username"
                required
                error={errors.username?.message}
            >
                <Input
                    id="username"
                    type="text"
                    placeholder="Choose a unique username"
                    aria-invalid={!!errors.username}
                    disabled={isSubmitting}
                    {...register("username")}
                />
            </FormField>

            <FormField
                label="Display Name"
                htmlFor="displayName"
                required
                error={errors.displayName?.message}
            >
                <Input
                    id="displayName"
                    type="text"
                    placeholder="How you want to appear (emojis & special chars allowed! ✨)"
                    aria-invalid={!!errors.displayName}
                    disabled={isSubmitting}
                    {...register("displayName")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    You can use emojis and special characters to make your name unique!
                </p>
                {displayNameValue && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                        <p className="text-sm font-semibold">{formatDisplayName(displayNameValue)}</p>
                    </div>
                )}
            </FormField>

            <FormField
                label="Status Message"
                htmlFor="statusMessage"
                error={errors.statusMessage?.message}
            >
                <Input
                    id="statusMessage"
                    type="text"
                    placeholder="What's on your mind?"
                    aria-invalid={!!errors.statusMessage}
                    disabled={isSubmitting}
                    {...register("statusMessage")}
                />
            </FormField>

            {errors.root && (
                <Alert status="error">
                    <Alert.Description>{errors.root.message}</Alert.Description>
                </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Setting up..." : "Complete Setup"}
            </Button>
        </form>
    );
}
