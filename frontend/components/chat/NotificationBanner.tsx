"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBannerProps {
    message: string;
    type?: "info" | "success" | "warning" | "error";
    duration?: number;
    onClose?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
    message,
    type = "info",
    duration = 5000,
    onClose,
}) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onClose) {
                    onClose();
                }
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!visible) {
        return null;
    }

    const typeStyles = {
        info: "bg-blue-500 border-blue-600",
        success: "bg-green-500 border-green-600",
        warning: "bg-yellow-500 border-yellow-600",
        error: "bg-red-500 border-red-600",
    };

    return (
        <div
            className={cn(
                "fixed top-4 right-4 z-50 max-w-md p-4 border-2 text-white shadow-lg animate-in slide-in-from-top-5",
                typeStyles[type]
            )}
        >
            <div className="flex items-start gap-3">
                <div className="flex-1 text-sm font-semibold">{message}</div>
                <button
                    onClick={() => {
                        setVisible(false);
                        if (onClose) {
                            onClose();
                        }
                    }}
                    className="hover:opacity-80 transition-opacity"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
