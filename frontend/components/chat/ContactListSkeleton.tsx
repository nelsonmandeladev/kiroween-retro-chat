"use client";

import React from "react";
import { Skeleton } from "@/components/retroui/Skeleton";

interface ContactListSkeletonProps {
    count?: number;
}

export const ContactListSkeleton: React.FC<ContactListSkeletonProps> = ({
    count = 5,
}) => {
    return (
        <div className="flex flex-col h-full msn-panel">
            {/* Kirhost skeleton */}
            <div className="msn-contact-item flex flex-row items-center gap-2.5">
                <div className="relative">
                    <Skeleton variant="circle" className="h-12 w-12" />
                    <div className="absolute bottom-0 right-0">
                        <Skeleton variant="circle" className="h-3 w-3" />
                    </div>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton variant="text" className="w-24 h-4" />
                    <Skeleton variant="text" className="w-32 h-3" />
                </div>
            </div>

            {/* Scrollable contacts skeleton */}
            <div className="flex-1 overflow-y-auto msn-scrollbar">
                {/* Friends Section Header */}
                <div className="px-3 py-2 bg-(--msn-button-bg)">
                    <Skeleton variant="text" className="w-32 h-4" />
                </div>

                {/* Friend items */}
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className="msn-contact-item flex items-center gap-3"
                    >
                        <div className="relative">
                            <Skeleton variant="circle" className="h-12 w-12" />
                            <div className="absolute bottom-0 right-0">
                                <Skeleton variant="circle" className="h-3 w-3" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                            <Skeleton variant="text" className="w-28 h-4" />
                            <Skeleton variant="text" className="w-36 h-3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
