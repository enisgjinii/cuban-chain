"use client";

import type { SurfaceId, SurfaceConfig } from "@/lib/chain-config-types";

interface ZoneSelectorProps {
    selectedZone: SurfaceId;
    onZoneSelect: (zone: SurfaceId) => void;
    currentConfig?: {
        top1: SurfaceConfig;
        top2: SurfaceConfig;
        side1: SurfaceConfig;
        side2: SurfaceConfig;
    };
}

// Surface type display names
const SURFACE_TYPE_LABELS: Record<SurfaceConfig["type"], string> = {
    empty: "Empty",
    gemstones: "Diamonds",
    moissanites: "Moissanites",
    enamel: "Enamel",
    engraving: "Engraving",
};

// Zone labels for display
const ZONE_LABELS: Record<SurfaceId, string> = {
    side1: "Left Side",
    side2: "Right Side",
    top1: "Top Face 1",
    top2: "Top Face 2",
};

// Get color indicator for a surface config
function getZoneColor(config?: SurfaceConfig): string {
    if (!config) return "#e5e7eb"; // gray-200

    switch (config.type) {
        case "gemstones":
            return config.gemstoneColors?.stone1 || "#ffffff";
        case "moissanites":
            return config.gemstoneColors?.stone1 || "#e0e7ff";
        case "enamel":
            return config.enamelColor || "#ffffff";
        case "engraving":
            return "#4b5563"; // gray-600
        default:
            return "#e5e7eb"; // gray-200 for empty
    }
}

export function ZoneSelector({
    selectedZone,
    onZoneSelect,
    currentConfig,
}: ZoneSelectorProps) {
    const zones: SurfaceId[] = ["side1", "top1", "top2", "side2"];

    return (
        <div className="mb-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
            <label className="text-xs font-medium text-gray-600 mb-2 block">
                Select Zone to Customize
            </label>

            {/* Visual Link Diagram */}
            <div className="flex items-center justify-center gap-1 mb-3">
                {/* Left Side */}
                <button
                    onClick={() => onZoneSelect("side1")}
                    className={`relative h-16 w-8 rounded-l-lg transition-all duration-200 border-2 ${selectedZone === "side1"
                            ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                    style={{ backgroundColor: getZoneColor(currentConfig?.side1) }}
                    title={`Left Side: ${SURFACE_TYPE_LABELS[currentConfig?.side1?.type || "empty"]}`}
                >
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 drop-shadow-sm">
                        L
                    </span>
                </button>

                {/* Center - Top Faces */}
                <div className="flex flex-col gap-1">
                    {/* Top Face 1 */}
                    <button
                        onClick={() => onZoneSelect("top1")}
                        className={`relative h-7 w-20 rounded-t-md transition-all duration-200 border-2 ${selectedZone === "top1"
                                ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                        style={{ backgroundColor: getZoneColor(currentConfig?.top1) }}
                        title={`Top Face 1: ${SURFACE_TYPE_LABELS[currentConfig?.top1?.type || "empty"]}`}
                    >
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 drop-shadow-sm">
                            T1
                        </span>
                    </button>

                    {/* Top Face 2 */}
                    <button
                        onClick={() => onZoneSelect("top2")}
                        className={`relative h-7 w-20 rounded-b-md transition-all duration-200 border-2 ${selectedZone === "top2"
                                ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                        style={{ backgroundColor: getZoneColor(currentConfig?.top2) }}
                        title={`Top Face 2: ${SURFACE_TYPE_LABELS[currentConfig?.top2?.type || "empty"]}`}
                    >
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 drop-shadow-sm">
                            T2
                        </span>
                    </button>
                </div>

                {/* Right Side */}
                <button
                    onClick={() => onZoneSelect("side2")}
                    className={`relative h-16 w-8 rounded-r-lg transition-all duration-200 border-2 ${selectedZone === "side2"
                            ? "border-blue-500 ring-2 ring-blue-300 scale-105"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                    style={{ backgroundColor: getZoneColor(currentConfig?.side2) }}
                    title={`Right Side: ${SURFACE_TYPE_LABELS[currentConfig?.side2?.type || "empty"]}`}
                >
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 drop-shadow-sm">
                        R
                    </span>
                </button>
            </div>

            {/* Zone Pills */}
            <div className="flex flex-wrap gap-1 justify-center">
                {zones.map((zone) => (
                    <button
                        key={zone}
                        onClick={() => onZoneSelect(zone)}
                        className={`px-2 py-1 text-xs rounded-full transition-all ${selectedZone === zone
                                ? "bg-blue-500 text-white font-medium"
                                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                            }`}
                    >
                        {ZONE_LABELS[zone]}
                    </button>
                ))}
            </div>

            {/* Current Selection Info */}
            <div className="mt-2 text-center">
                <span className="text-xs text-gray-500">
                    Editing: <span className="font-medium text-blue-600">{ZONE_LABELS[selectedZone]}</span>
                    {currentConfig?.[selectedZone] && (
                        <span className="ml-1 text-gray-400">
                            ({SURFACE_TYPE_LABELS[currentConfig[selectedZone].type]})
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}
