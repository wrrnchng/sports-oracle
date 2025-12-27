"use client"

import { cn } from "@/lib/utils"

interface LiveIndicatorProps {
    className?: string
    showLabel?: boolean
}

export function LiveIndicator({ className, showLabel = true }: LiveIndicatorProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </div>
            {showLabel && (
                <span className="text-xs font-semibold uppercase tracking-wide text-red-600">
                    Live
                </span>
            )}
        </div>
    )
}
