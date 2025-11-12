import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "circle" | "text";
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, variant = "default", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "animate-pulse bg-gray-200 border-2 border-black",
                    variant === "circle" && "rounded-full",
                    variant === "text" && "h-4 rounded",
                    variant === "default" && "rounded",
                    className
                )}
                {...props}
            />
        );
    }
);

Skeleton.displayName = "Skeleton";

export { Skeleton };
