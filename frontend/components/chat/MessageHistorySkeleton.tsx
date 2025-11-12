"use client";

import React from "react";
import { Skeleton } from "@/components/retroui/Skeleton";

interface MessageHistorySkeletonProps {
    count?: number;
}

export const MessageHistorySkeleton: React.FC<MessageHistorySkeletonProps> = ({
    count = 6,
}) => {
    return (
        <div className="flex flex-col gap-4 p-4">
            {Array.from({ length: count }).map((_, index) => {
                // Alternate between sent and received messages
                const isSent = index % 2 === 0;

                return (
                    <div
                        key={index}
                        className={`flex gap-2 ${isSent ? "flex-row-reverse" : "flex-row"}`}
                    >
                        {/* Avatar for received messages */}
                        {!isSent && <Skeleton variant="circle" className="w-8 h-8 shrink-0" />}

                        {/* Message bubble */}
                        <div
                            className={`flex flex-col max-w-[70%] ${isSent ? "items-end" : "items-start"}`}
                        >
                            <Skeleton
                                variant="default"
                                className={`${isSent ? "w-48" : "w-56"} h-16 rounded-lg`}
                            />
                            <Skeleton variant="text" className="w-12 h-3 mt-1" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
