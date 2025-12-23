"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChainConfig, Material, SurfaceType } from "@/lib/chain-config-types";

interface PriceEstimatorProps {
    chainConfig: ChainConfig;
    className?: string;
}

// Price multipliers (example pricing - can be configured)
const MATERIAL_PRICES: Record<Material, number> = {
    silver: 50,
    gold: 500,
    grey: 30,
    black: 40,
    white: 45,
};

const SURFACE_PRICES: Record<SurfaceType, number> = {
    empty: 0,
    gemstones: 200, // Diamonds
    moissanites: 100,
    enamel: 25,
    engraving: 35,
};

const BASE_PRICE_PER_LINK = 20;

export function PriceEstimator({ chainConfig, className = "" }: PriceEstimatorProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const priceBreakdown = useMemo(() => {
        let materialCost = 0;
        let surfaceCost = 0;
        let baseCost = chainConfig.chainLength * BASE_PRICE_PER_LINK;

        chainConfig.links.forEach((link) => {
            // Material cost
            materialCost += MATERIAL_PRICES[link.material] || 0;

            // Surface costs
            Object.values(link.surfaces).forEach((surface) => {
                surfaceCost += SURFACE_PRICES[surface.type] || 0;
            });
        });

        const total = baseCost + materialCost + surfaceCost;

        return {
            baseCost,
            materialCost,
            surfaceCost,
            total,
        };
    }, [chainConfig]);

    return (
        <div className={`bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800 ${className}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 text-left"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Estimated Price
                        </div>
                        <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                            ${priceBreakdown.total.toLocaleString()}
                        </div>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-amber-200 dark:border-amber-800 pt-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-amber-700 dark:text-amber-300">Base ({chainConfig.chainLength} links)</span>
                        <span className="text-amber-900 dark:text-amber-100 font-medium">
                            ${priceBreakdown.baseCost.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-amber-700 dark:text-amber-300">Materials</span>
                        <span className="text-amber-900 dark:text-amber-100 font-medium">
                            ${priceBreakdown.materialCost.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-amber-700 dark:text-amber-300">Surfaces & Stones</span>
                        <span className="text-amber-900 dark:text-amber-100 font-medium">
                            ${priceBreakdown.surfaceCost.toLocaleString()}
                        </span>
                    </div>
                    <div className="border-t border-amber-200 dark:border-amber-800 pt-2 flex justify-between">
                        <span className="text-amber-800 dark:text-amber-200 font-semibold">Total</span>
                        <span className="text-amber-900 dark:text-amber-100 font-bold text-lg">
                            ${priceBreakdown.total.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 italic mt-2">
                        * Prices are estimates. Final pricing may vary.
                    </p>
                </div>
            )}
        </div>
    );
}
