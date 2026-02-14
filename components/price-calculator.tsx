import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { ChainConfig, Material } from "@/lib/chain-config-types";

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
    chainConfig.links.forEach((link) => {
      price += MATERIAL_PRICES[link.material] || 20;
      Object.values(link.surfaces).forEach((surface) => {
        if (surface.type) price += STONE_PRICES[surface.type] || 0;
      });
    });
    return price;
  }, [chainConfig]);

  return (
    <Box
      sx={{
        bgcolor: "action.hover",
        borderRadius: 2,
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        Estimated Total
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.light" }}>
        ${totalPrice.toLocaleString()}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>
        Based on {chainLength} links
      </Typography>
    </Box>
  );
}
