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

            <div className="flex items-center justify-center mb-4 scale-110 p-2">
                {/* Visual Chain Link Representation */}
                <div className="flex bg-white dark:bg-gray-800 rounded-full shadow-sm p-1 border border-gray-100 dark:border-gray-700">
                    {/* Left Side (Curved) */}
                    <button
                        onClick={() => onZoneSelect("side1")}
                        className={`relative h-20 w-12 rounded-l-3xl border-y-2 border-l-2 border-r transition-all duration-200 ${selectedZone === "side1"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 z-10"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        style={{ borderRightColor: "transparent" }} // Seamless connection
                        title={`Left Side: ${SURFACE_TYPE_LABELS[currentConfig?.side1?.type || "empty"]}`}
                    >
                        <div className="absolute inset-2 rounded-l-2xl opacity-30" style={{ backgroundColor: getZoneColor(currentConfig?.side1) }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400">L</span>
                    </button>

                    {/* Center (Top Faces) */}
                    <div className="flex flex-col h-20 w-24">
                        {/* Top 1 */}
                        <button
                            onClick={() => onZoneSelect("top1")}
                            className={`flex-1 border-2 transition-all duration-200 ${selectedZone === "top1"
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 z-10"
                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            style={{ borderBottomWidth: "1px" }}
                            title={`Top Face 1: ${SURFACE_TYPE_LABELS[currentConfig?.top1?.type || "empty"]}`}
                        >
                            <div className="w-full h-full opacity-30" style={{ backgroundColor: getZoneColor(currentConfig?.top1) }} />
                            <span className="absolute inset-0 flex items-center justify-center -translate-y-4 text-[10px] font-bold text-gray-400 pointer-events-none">T1</span>
                        </button>

                        {/* Top 2 */}
                        <button
                            onClick={() => onZoneSelect("top2")}
                            className={`flex-1 border-2 transition-all duration-200 ${selectedZone === "top2"
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 z-10"
                                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            style={{ borderTopWidth: "1px" }}
                            title={`Top Face 2: ${SURFACE_TYPE_LABELS[currentConfig?.top2?.type || "empty"]}`}
                        >
                            <div className="w-full h-full opacity-30" style={{ backgroundColor: getZoneColor(currentConfig?.top2) }} />
                            <span className="absolute inset-0 flex items-center justify-center translate-y-4 text-[10px] font-bold text-gray-400 pointer-events-none">T2</span>
                        </button>
                    </div>

                    {/* Right Side (Curved) */}
                    <button
                        onClick={() => onZoneSelect("side2")}
                        className={`relative h-20 w-12 rounded-r-3xl border-y-2 border-r-2 border-l transition-all duration-200 ${selectedZone === "side2"
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 z-10"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        style={{ borderLeftColor: "transparent" }} // Seamless connection
                        title={`Right Side: ${SURFACE_TYPE_LABELS[currentConfig?.side2?.type || "empty"]}`}
                    >
                        <div className="absolute inset-2 rounded-r-2xl opacity-30" style={{ backgroundColor: getZoneColor(currentConfig?.side2) }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400">R</span>
                    </button>
                </div>
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
