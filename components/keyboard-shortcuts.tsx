"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyboardShortcutsProps {
    onSave?: () => void;
    onUndo?: () => void;
    onRotateToggle?: () => void;
    onReplayAnimation?: () => void;
    onViewPreset?: (preset: number) => void;
    onCaptureImage?: () => void;
}

const SHORTCUTS = [
    { key: "?", label: "Show shortcuts", description: "Open this help dialog" },
    { key: "Ctrl/⌘ + S", label: "Save", description: "Save configuration" },
    { key: "Ctrl/⌘ + Z", label: "Undo", description: "Undo last change" },
    { key: "R", label: "Rotate", description: "Toggle auto-rotation" },
    { key: "Space", label: "Replay", description: "Replay entrance animation" },
    { key: "1", label: "Front View", description: "Switch to front view" },
    { key: "2", label: "Top View", description: "Switch to top view" },
    { key: "3", label: "Side View", description: "Switch to side view" },
    { key: "4", label: "Isometric", description: "Switch to 3D isometric view" },
    { key: "P", label: "Screenshot", description: "Capture screenshot" },
    { key: "F", label: "Fullscreen", description: "Toggle fullscreen mode" },
    { key: "Esc", label: "Close", description: "Close dialogs/panels" },
];

export function KeyboardShortcuts({
    onSave,
    onUndo,
    onRotateToggle,
    onReplayAnimation,
    onViewPreset,
    onCaptureImage,
}: KeyboardShortcutsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const modKey = isMac ? event.metaKey : event.ctrlKey;

            // ? - Show shortcuts
            if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
                event.preventDefault();
                setIsModalOpen(true);
                return;
            }

            // Escape - Close modal
            if (event.key === "Escape") {
                setIsModalOpen(false);
                return;
            }

            // Ctrl/Cmd + S - Save
            if (modKey && event.key === "s") {
                event.preventDefault();
                onSave?.();
                return;
            }

            // Ctrl/Cmd + Z - Undo
            if (modKey && event.key === "z") {
                event.preventDefault();
                onUndo?.();
                return;
            }

            // R - Toggle rotation
            if (event.key === "r" || event.key === "R") {
                event.preventDefault();
                onRotateToggle?.();
                return;
            }

            // Space - Replay animation
            if (event.key === " ") {
                event.preventDefault();
                onReplayAnimation?.();
                return;
            }

            // Number keys 1-4 for view presets
            if (["1", "2", "3", "4"].includes(event.key)) {
                event.preventDefault();
                onViewPreset?.(parseInt(event.key));
                return;
            }

            // P - Screenshot
            if (event.key === "p" || event.key === "P") {
                event.preventDefault();
                onCaptureImage?.();
                return;
            }

            // F - Fullscreen
            if (event.key === "f" || event.key === "F") {
                event.preventDefault();
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
                return;
            }
        },
        [onSave, onUndo, onRotateToggle, onReplayAnimation, onViewPreset, onCaptureImage]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return (
        <>
            {/* Floating shortcut hint button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-4 left-4 z-40 h-8 w-8 p-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 rounded-full hover:scale-110 transition-transform"
                title="Keyboard shortcuts (?)"
            >
                <Keyboard className="w-4 h-4" />
            </Button>

            {/* Shortcuts Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Keyboard className="w-5 h-5 text-blue-500" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Keyboard Shortcuts
                                </h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsModalOpen(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Shortcuts List */}
                        <div className="p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                {SHORTCUTS.map((shortcut) => (
                                    <div
                                        key={shortcut.key}
                                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {shortcut.label}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {shortcut.description}
                                            </div>
                                        </div>
                                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-600 dark:text-gray-400">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
