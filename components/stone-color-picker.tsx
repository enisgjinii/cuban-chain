"use client";

import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { AutoAwesome } from "@mui/icons-material";
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

export function StoneColorPicker({ surfaceId, gemstoneColors, onChange, disabled = false }: StoneColorPickerProps) {
  const [selectedStone, setSelectedStone] = useState<"stone1" | "stone2" | "stone3">("stone1");

  const isTopSurface = surfaceId === "top1" || surfaceId === "top2";
  const stoneCount = isTopSurface ? 3 : 2;

  const handleColorChange = (color: string) => {
    onChange({ ...gemstoneColors, [selectedStone]: color });
  };

  const handleApplyToAll = (color: string) => {
    onChange({ stone1: color, stone2: color, ...(isTopSurface && { stone3: color }) });
  };

  return (
    <Box sx={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
        <AutoAwesome sx={{ fontSize: 14, color: "primary.main" }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>Individual Stone Colors</Typography>
      </Box>

      {/* Stone Selection */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {Array.from({ length: stoneCount }).map((_, index) => {
          const stoneKey = `stone${index + 1}` as "stone1" | "stone2" | "stone3";
          const color = gemstoneColors[stoneKey] || "#ffffff";
          const isActive = selectedStone === stoneKey;

          return (
            <Box
              key={stoneKey}
              onClick={() => setSelectedStone(stoneKey)}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                p: 1,
                borderRadius: 2,
                border: "2px solid",
                borderColor: isActive ? "primary.main" : "divider",
                bgcolor: isActive ? "rgba(212,160,23,0.08)" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: color,
                  border: "2px solid rgba(255,255,255,0.3)",
                  boxShadow: color === "#ffffff" ? "inset 0 0 0 1px #555" : "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
              <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
                Stone {index + 1}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Color Presets */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>Color Presets</Typography>
        <Button
          size="small"
          onClick={() => handleApplyToAll(gemstoneColors[selectedStone] || "#ffffff")}
          sx={{ fontSize: "0.65rem", minWidth: 0, p: 0.5, color: "primary.light" }}
        >
          Apply to all
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, mb: 2 }}>
        {COLOR_PRESETS.map((preset) => (
          <Box
            key={preset.value}
            className={`swatch-btn ${gemstoneColors[selectedStone] === preset.value ? "active" : ""}`}
            onClick={() => handleColorChange(preset.value)}
            sx={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: 1.5,
              bgcolor: preset.value,
              border: preset.value === "#ffffff" ? "2px solid #444" : undefined,
            }}
            title={preset.label}
          />
        ))}
      </Box>

      {/* Custom input */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Box
          component="input"
          type="color"
          value={gemstoneColors[selectedStone] || "#ffffff"}
          onChange={(e: any) => handleColorChange(e.target.value)}
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            cursor: "pointer",
            background: "none",
            "&::-webkit-color-swatch-wrapper": { padding: 0 },
            "&::-webkit-color-swatch": { borderRadius: 4, border: "none" },
          }}
        />
        <Box
          component="input"
          type="text"
          value={gemstoneColors[selectedStone] || "#ffffff"}
          onChange={(e: any) => handleColorChange(e.target.value)}
          placeholder="#ffffff"
          sx={{
            flex: 1,
            px: 1.25,
            py: 0.75,
            fontSize: "0.8rem",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
            color: "text.primary",
            textTransform: "uppercase",
            outline: "none",
            "&:focus": { borderColor: "primary.main" },
          }}
        />
      </Box>
    </Box>
  );
}
