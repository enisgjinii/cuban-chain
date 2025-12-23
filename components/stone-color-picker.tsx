"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { SurfaceId, GemstoneColors } from "@/lib/chain-config-types";

interface StoneColorPickerProps {
    surfaceId: SurfaceId;
    gemstoneColors: GemstoneColors;
    onChange: (colors: GemstoneColors) => void;
    disabled?: boolean;
}

const COLOR_PRESETS = [
    { label: "Colourless", value: "#ffffff" },
    { label: "Black", value: "#000000" },
    { label: "Red", value: "#dc2626" },
    { label: "Blue", value: "#2563eb" },
    { label: "Green", value: "#16a34a" },
    { label: "Yellow", value: "#eab308" },
    { label: "Orange", value: "#ea580c" },
    { label: "Pink", value: "#ec4899" },
    { label: "Purple", value: "#9333ea" },
];

export function StoneColorPicker({
    surfaceId,
    gemstoneColors,
    onChange,
    disabled = false,
}: StoneColorPickerProps) {
    const [selectedStone, setSelectedStone] = useState<"stone1" | "stone2" | "stone3">("stone1");

    const isTopSurface = surfaceId === "top1" || surfaceId === "top2";
    const stoneCount = isTopSurface ? 3 : 2;

    const handleColorChange = (color: string) => {
        const newColors: GemstoneColors = {
            ...gemstoneColors,
            [selectedStone]: color,
        };
        onChange(newColors);
    };

    const handleApplyToAll = (color: string) => {
        const newColors: GemstoneColors = {
            stone1: color,
            stone2: color,
            ...(isTopSurface && { stone3: color }),
        };
        onChange(newColors);
    };

    return (
        <div className={`space-y-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
            <Label className="text-xs flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Individual Stone Colors
            </Label>

            {/* Stone Selection */}
            <div className="flex gap-2">
                {Array.from({ length: stoneCount }).map((_, index) => {
                    const stoneKey = `stone${index + 1}` as "stone1" | "stone2" | "stone3";
                    const color = gemstoneColors[stoneKey] || "#ffffff";

                    return (
                        <button
                            key={stoneKey}
                            onClick={() => setSelectedStone(stoneKey)}
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${selectedStone === stoneKey
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                        >
                            <div
                                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                                style={{
                                    backgroundColor: color,
                                    boxShadow: color === "#ffffff"
                                        ? "inset 0 0 0 1px #e5e7eb, 0 1px 3px rgba(0,0,0,0.1)"
                                        : "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                Stone {index + 1}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Color Presets */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Color Presets</span>
                    <button
                        onClick={() => handleApplyToAll(gemstoneColors[selectedStone] || "#ffffff")}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                        Apply to all
                    </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handleColorChange(preset.value)}
                            className={`w-full aspect-square rounded-lg border-2 transition-all ${gemstoneColors[selectedStone] === preset.value
                                    ? "border-blue-500 ring-2 ring-blue-200"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                            style={{
                                backgroundColor: preset.value,
                                boxShadow: preset.value === "#ffffff"
                                    ? "inset 0 0 0 1px #e5e7eb"
                                    : undefined,
                            }}
                            title={preset.label}
                        />
                    ))}
                </div>
            </div>

            {/* Custom Color Input */}
            <div className="flex gap-2">
                <input
                    type="color"
                    value={gemstoneColors[selectedStone] || "#ffffff"}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700"
                />
                <input
                    type="text"
                    value={gemstoneColors[selectedStone] || "#ffffff"}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 uppercase"
                    placeholder="#ffffff"
                />
            </div>
        </div>
    );
}
