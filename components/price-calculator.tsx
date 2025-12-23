import React, { useMemo } from 'react';
import { ChainConfig, Material, SurfaceType } from '@/lib/chain-config-types';

interface PriceCalculatorProps {
    chainConfig: ChainConfig;
    chainLength: number;
}

const MATERIAL_PRICES: Record<Material, number> = {
    silver: 25,
    gold: 80,
    grey: 20,
    black: 30,
    white: 25,
};

const STONE_PRICES: Record<string, number> = {
    gemstones: 15,
    moissanites: 40,
    enamel: 10,
    engraving: 5,
    empty: 0,
};

export function PriceCalculator({ chainConfig, chainLength }: PriceCalculatorProps) {
    const totalPrice = useMemo(() => {
        let price = 0;

        // Base chain price per link
        chainConfig.links.forEach((link) => {
            // Material cost
            price += MATERIAL_PRICES[link.material] || 20;

            // Surface/Stones cost
            Object.values(link.surfaces).forEach((surface) => {
                if (surface.type) {
                    price += STONE_PRICES[surface.type] || 0;
                }
            });
        });

        return price;
    }, [chainConfig]);

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex flex-col gap-1 items-center justify-center border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estimated Total</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400">
                Based on {chainLength} links
            </span>
        </div>
    );
}
