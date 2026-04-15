"use client";

import { useEffect, useState } from "react";
import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
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

  useEffect(() => {
    if (!isTopSurface && selectedStone === "stone3") {
      setSelectedStone("stone1");
    }
  }, [isTopSurface, selectedStone]);

  const handleColorChange = (color: string) => {
    onChange({ ...gemstoneColors, [selectedStone]: color });
  };

  const handleApplyToAll = (color: string) => {
    onChange({ stone1: color, stone2: color, ...(isTopSurface && { stone3: color }) });
  };

  return (
    <Stack gap="xs" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <Group gap={6}>
        <IconSparkles size={14} color="#2b2d30" />
        <Text size="xs" fw={700}>Individual stone colors</Text>
      </Group>

      <Group gap="xs" grow>
        {Array.from({ length: stoneCount }).map((_, index) => {
          const stoneKey = `stone${index + 1}` as "stone1" | "stone2" | "stone3";
          const color = gemstoneColors[stoneKey] || "#ffffff";
          const isActive = selectedStone === stoneKey;

          return (
            <Box
              key={stoneKey}
              onClick={() => setSelectedStone(stoneKey)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: 8,
                borderRadius: 8,
                border: `1px solid ${isActive ? "rgba(80,105,255,0.72)" : "rgba(45,45,45,0.12)"}`,
                background: isActive ? "rgba(255,255,255,0.56)" : "rgba(255,255,255,0.18)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: color,
                  border: "2px solid rgba(255,255,255,0.3)",
                  boxShadow: color === "#ffffff" ? "inset 0 0 0 1px #555" : "0 2px 6px rgba(0,0,0,0.3)",
                }}
              />
              <Text size="xs" c="dimmed">
                Stone {index + 1}
              </Text>
            </Box>
          );
        })}
      </Group>

      <Group justify="space-between">
        <Text size="xs" c="dimmed">Color presets</Text>
        <Button
          size="xs"
          variant="subtle"
          onClick={() => handleApplyToAll(gemstoneColors[selectedStone] || "#ffffff")}
        >
          Apply to all
        </Button>
      </Group>

      <Box style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {COLOR_PRESETS.map((preset) => (
          <Box
            key={preset.value}
            className={`swatch-btn ${gemstoneColors[selectedStone] === preset.value ? "active" : ""}`}
            onClick={() => handleColorChange(preset.value)}
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: 8,
              background: preset.value,
              border:
                gemstoneColors[selectedStone] === preset.value
                  ? "2px solid rgba(80,105,255,0.72)"
                  : preset.value === "#ffffff"
                    ? "1px solid rgba(0,0,0,0.35)"
                    : "1px solid rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
            title={preset.label}
          />
        ))}
      </Box>

      <Group gap="xs" wrap="nowrap">
        <Box
          component="input"
          type="color"
          value={gemstoneColors[selectedStone] || "#ffffff"}
          onChange={(e: any) => handleColorChange(e.target.value)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid rgba(45,45,45,0.12)",
            cursor: "pointer",
            background: "none",
          }}
        />
        <Box
          component="input"
          type="text"
          value={gemstoneColors[selectedStone] || "#ffffff"}
          onChange={(e: any) => handleColorChange(e.target.value)}
          placeholder="#ffffff"
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: "0.8rem",
            borderRadius: 8,
            border: "1px solid rgba(45,45,45,0.12)",
            background: "rgba(255,255,255,0.36)",
            color: "#24272b",
            textTransform: "uppercase",
            outline: "none",
          }}
        />
      </Group>
    </Stack>
  );
}
