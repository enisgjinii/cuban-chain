"use client";

import { useState } from "react";
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCcw,
    Play,
    Pause,
    Eye,
    Box,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ViewerControlsProps {
    autoRotate: boolean;
    setAutoRotate: (value: boolean) => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetView?: () => void;
    onViewPreset?: (preset: ViewPreset) => void;
    onFullscreen?: () => void;
    className?: string;
    isMobile?: boolean;
}

export type ViewPreset = "front" | "back" | "top" | "left" | "right" | "isometric";

const VIEW_PRESETS: { id: ViewPreset; label: string; icon: React.ReactNode }[] = [
    { id: "front", label: "Front", icon: <Eye className="w-3 h-3" /> },
    { id: "top", label: "Top", icon: <ArrowUp className="w-3 h-3" /> },
    { id: "left", label: "Left", icon: <ArrowLeft className="w-3 h-3" /> },
    { id: "right", label: "Right", icon: <ArrowRight className="w-3 h-3" /> },
    { id: "isometric", label: "3D", icon: <Box className="w-3 h-3" /> },
];

export function ViewerControls({
    autoRotate,
    setAutoRotate,
    onZoomIn,
    onZoomOut,
    onResetView,
    onViewPreset,
    onFullscreen,
    className = "",
    isMobile = false,
}: ViewerControlsProps) {
    const [showViewPresets, setShowViewPresets] = useState(false);

    const buttonSize = isMobile ? "h-10 w-10" : "h-8 w-8";
    const iconSize = isMobile ? "w-5 h-5" : "w-4 h-4";

    return (
        <TooltipProvider delayDuration={300}>
            <div
                className={`flex flex-col gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
            >
                {/* Zoom Controls */}
                <div className="flex flex-col gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onZoomIn}
                                className={`${buttonSize} p-0 hover:bg-gray-100 dark:hover:bg-gray-800`}
                            >
                                <ZoomIn className={iconSize} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Zoom In</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onZoomOut}
                                className={`${buttonSize} p-0 hover:bg-gray-100 dark:hover:bg-gray-800`}
                            >
                                <ZoomOut className={iconSize} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Zoom Out</TooltipContent>
                    </Tooltip>
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

                {/* View Presets */}
                <div className="relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowViewPresets(!showViewPresets)}
                                className={`${buttonSize} p-0 hover:bg-gray-100 dark:hover:bg-gray-800 ${showViewPresets ? "bg-gray-100 dark:bg-gray-800" : ""
                                    }`}
                            >
                                <Eye className={iconSize} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">View Angles</TooltipContent>
                    </Tooltip>

                    {showViewPresets && (
                        <div className="absolute right-full mr-2 top-0 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 flex gap-1">
                            {VIEW_PRESETS.map((preset) => (
                                <Tooltip key={preset.id}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                onViewPreset?.(preset.id);
                                                setShowViewPresets(false);
                                            }}
                                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            {preset.icon}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{preset.label}</TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

                {/* Auto Rotate */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAutoRotate(!autoRotate)}
                            className={`${buttonSize} p-0 ${autoRotate
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                        >
                            {autoRotate ? (
                                <Pause className={iconSize} />
                            ) : (
                                <Play className={iconSize} />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        {autoRotate ? "Stop Rotation" : "Auto Rotate"}
                    </TooltipContent>
                </Tooltip>

                {/* Reset View */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onResetView}
                            className={`${buttonSize} p-0 hover:bg-gray-100 dark:hover:bg-gray-800`}
                        >
                            <RotateCcw className={iconSize} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Reset View</TooltipContent>
                </Tooltip>

                {/* Fullscreen */}
                {onFullscreen && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onFullscreen}
                                className={`${buttonSize} p-0 hover:bg-gray-100 dark:hover:bg-gray-800`}
                            >
                                <Maximize2 className={iconSize} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Fullscreen</TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}
