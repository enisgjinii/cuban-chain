"use client";

import { useState } from "react";
import { X, Download, Image, Droplet, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ScreenshotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (options: ScreenshotOptions) => void;
}

export interface ScreenshotOptions {
    addWatermark: boolean;
    watermarkText: string;
    backgroundColor: string;
    resolution: "1x" | "2x" | "4x";
    format: "png" | "jpg";
}

const BACKGROUND_COLORS = [
    { label: "White", value: "#ffffff" },
    { label: "Black", value: "#000000" },
    { label: "Transparent", value: "transparent" },
    { label: "Gray", value: "#f3f4f6" },
    { label: "Gold", value: "#fef3c7" },
    { label: "Silver", value: "#e5e7eb" },
];

const RESOLUTIONS = [
    { label: "1x (Standard)", value: "1x" as const },
    { label: "2x (High)", value: "2x" as const },
    { label: "4x (Ultra)", value: "4x" as const },
];

export function ScreenshotModal({ isOpen, onClose, onCapture }: ScreenshotModalProps) {
    const [options, setOptions] = useState<ScreenshotOptions>({
        addWatermark: true,
        watermarkText: "Cuban Chain Customizer",
        backgroundColor: "#ffffff",
        resolution: "2x",
        format: "png",
    });

    if (!isOpen) return null;

    const handleCapture = () => {
        onCapture(options);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Screenshot Options
                        </h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Watermark */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="watermark"
                                checked={options.addWatermark}
                                onCheckedChange={(checked) =>
                                    setOptions({ ...options, addWatermark: !!checked })
                                }
                            />
                            <Label htmlFor="watermark" className="text-sm cursor-pointer">
                                Add watermark
                            </Label>
                        </div>
                        {options.addWatermark && (
                            <input
                                type="text"
                                value={options.watermarkText}
                                onChange={(e) =>
                                    setOptions({ ...options, watermarkText: e.target.value })
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="Watermark text..."
                            />
                        )}
                    </div>

                    {/* Background Color */}
                    <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-2">
                            <Droplet className="w-4 h-4" />
                            Background Color
                        </Label>
                        <div className="flex gap-2 flex-wrap">
                            {BACKGROUND_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setOptions({ ...options, backgroundColor: color.value })}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all ${options.backgroundColor === color.value
                                            ? "border-blue-500 ring-2 ring-blue-200"
                                            : "border-gray-200 dark:border-gray-700"
                                        }`}
                                    style={{
                                        backgroundColor: color.value === "transparent" ? undefined : color.value,
                                        backgroundImage:
                                            color.value === "transparent"
                                                ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                                : undefined,
                                        backgroundSize: "8px 8px",
                                        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                                    }}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Resolution */}
                    <div className="space-y-2">
                        <Label className="text-sm">Resolution</Label>
                        <div className="flex gap-2">
                            {RESOLUTIONS.map((res) => (
                                <button
                                    key={res.value}
                                    onClick={() => setOptions({ ...options, resolution: res.value })}
                                    className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${options.resolution === res.value
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    {res.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format */}
                    <div className="space-y-2">
                        <Label className="text-sm">Format</Label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOptions({ ...options, format: "png" })}
                                className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${options.format === "png"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                            >
                                PNG (Lossless)
                            </button>
                            <button
                                onClick={() => setOptions({ ...options, format: "jpg" })}
                                className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${options.format === "jpg"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                            >
                                JPG (Smaller)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button onClick={handleCapture} className="flex-1 gap-2">
                        <Download className="w-4 h-4" />
                        Capture
                    </Button>
                </div>
            </div>
        </div>
    );
}
