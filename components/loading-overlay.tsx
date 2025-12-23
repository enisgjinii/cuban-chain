"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
    isLoading: boolean;
    progress?: number; // 0-100
    message?: string;
}

export function LoadingOverlay({
    isLoading,
    progress,
    message = "Loading your chain...",
}: LoadingOverlayProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
        } else {
            // Delay hiding for smooth transition
            const timer = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 ${isLoading ? "opacity-100" : "opacity-0"
                }`}
        >
            <div className="flex flex-col items-center gap-4">
                {/* Animated Chain Icon */}
                <div className="relative w-20 h-20">
                    <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full animate-pulse"
                    >
                        {/* Chain links */}
                        <ellipse
                            cx="35"
                            cy="50"
                            rx="20"
                            ry="25"
                            fill="none"
                            stroke="url(#goldGradient)"
                            strokeWidth="8"
                            className="animate-[spin_3s_ease-in-out_infinite]"
                            style={{ transformOrigin: "35px 50px" }}
                        />
                        <ellipse
                            cx="65"
                            cy="50"
                            rx="20"
                            ry="25"
                            fill="none"
                            stroke="url(#goldGradient)"
                            strokeWidth="8"
                            className="animate-[spin_3s_ease-in-out_infinite_reverse]"
                            style={{ transformOrigin: "65px 50px", animationDelay: "0.5s" }}
                        />
                        <defs>
                            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="50%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Loading Text */}
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {message}
                    </p>

                    {/* Progress Bar */}
                    {progress !== undefined && (
                        <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {progress !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {Math.round(progress)}%
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Skeleton loader for panels
export function PanelSkeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse space-y-4 ${className}`}>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
        </div>
    );
}

// Inline loading spinner
export function InlineLoader({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    return (
        <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-500`} />
    );
}
