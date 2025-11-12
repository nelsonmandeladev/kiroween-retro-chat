"use client";

import React from "react";

interface TypingIndicatorProps {
    usernames?: string[];
    variant?: "default" | "ai";
    className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    usernames = [],
    variant = "default",
    className = "",
}) => {
    const displayText = () => {
        if (variant === "ai") {
            return "AI is typing";
        }

        if (usernames.length === 0) {
            return "Someone is typing";
        }

        if (usernames.length === 1) {
            return `${usernames[0]} is typing`;
        }

        if (usernames.length === 2) {
            return `${usernames[0]} and ${usernames[1]} are typing`;
        }

        return `${usernames[0]} and ${usernames.length - 1} others are typing`;
    };

    return (
        <div className={`flex items-center gap-2 msn-typing ${className}`}>
            <span className="text-xs text-gray-600 italic">{displayText()}</span>
            <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );
};
