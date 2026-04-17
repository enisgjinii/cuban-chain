"use client";

import { useEffect, useState } from "react";
import { Box, Button, Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconCheck, IconPalette } from "@tabler/icons-react";
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

  const currentColor = gemstoneColors[selectedStone] || "#ffffff";

  return (
    <Stack gap={8} style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <Group gap={6} grow>
        {Array.from({ length: stoneCount }).map((_, index) => {
          const stoneKey = `stone${index + 1}` as "stone1" | "stone2" | "stone3";
          const color = gemstoneColors[stoneKey] || "#ffffff";
          const isActive = selectedStone === stoneKey;

          return (
            <Tooltip key={stoneKey} label={`Select stone ${index + 1} to change its color`} withArrow>
              <Box
                onClick={() => setSelectedStone(stoneKey)}
                role="button"
                tabIndex={0}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "8px 4px",
                  borderRadius: 14,
                  border: `1px solid ${isActive ? "rgba(20,112,105,0.52)" : "rgba(255,255,255,0.58)"}`,
                  background: isActive ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.42)",
                  boxShadow: isActive
                    ? "0 0 0 3px rgba(20,112,105,0.14), inset 0 1px 0 rgba(255,255,255,0.95)"
                    : "inset 0 1px 0 rgba(255,255,255,0.75)",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <Box
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: color,
                    border: color === "#ffffff" ? "1px solid rgba(0,0,0,0.22)" : "1px solid rgba(255,255,255,0.35)",
                    boxShadow: color === "#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.08)" : "0 2px 4px rgba(0,0,0,0.25)",
                  }}
                />
                <Text size="10px" c={isActive ? "#0d3f3b" : "dimmed"} fw={700}>
                  Stone {index + 1}
                </Text>
              </Box>
            </Tooltip>
          );
        })}
      </Group>

      <Group justify="space-between" align="center" gap={4}>
        <Group gap={4} wrap="nowrap">
          <IconPalette size={12} color="#47696b" />
          <Text size="xs" fw={700} c="#0d3f3b">
            Presets
          </Text>
        </Group>
        <Tooltip label="Copy this stone's color to every stone on the face" withArrow>
          <Button
            size="compact-xs"
            variant="subtle"
            leftSection={<IconCheck size={12} />}
            onClick={() => handleApplyToAll(currentColor)}
            styles={{ root: { color: "#0d3f3b" } }}
          >
            Apply to all
          </Button>
        </Tooltip>
      </Group>

      <Box style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 6 }}>
        {COLOR_PRESETS.map((preset) => {
          const isActive = currentColor.toLowerCase() === preset.value.toLowerCase();
          return (
            <Tooltip key={preset.value} label={preset.label} withArrow>
              <button
                type="button"
                aria-label={preset.label}
                onClick={() => handleColorChange(preset.value)}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  minHeight: 22,
                  borderRadius: 10,
                  padding: 0,
                  background: preset.value,
                  cursor: "pointer",
                  border: isActive
                    ? "2px solid rgba(20,112,105,0.7)"
                    : preset.value === "#ffffff"
                      ? "1px solid rgba(0,0,0,0.28)"
                      : "1px solid rgba(255,255,255,0.35)",
                  boxShadow: isActive
                    ? "0 0 0 2px rgba(20,112,105,0.2)"
                    : "0 1px 3px rgba(0,0,0,0.12)",
                  transition: "transform 0.15s",
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Group gap="xs" wrap="nowrap" align="center">
        <Tooltip label="Open native color picker" withArrow>
          <Box
            component="input"
            type="color"
            value={currentColor}
            onChange={(e: any) => handleColorChange(e.target.value)}
            style={{
              width: 38,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.72)",
              cursor: "pointer",
              background: "rgba(255,255,255,0.5)",
              padding: 2,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          />
        </Tooltip>
        <Box
          component="input"
          type="text"
          value={currentColor}
          onChange={(e: any) => handleColorChange(e.target.value)}
          placeholder="#ffffff"
          maxLength={7}
          style={{
            flex: 1,
            padding: "7px 11px",
            fontSize: "0.78rem",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.72)",
            background: "rgba(255,255,255,0.52)",
            color: "#1a2f33",
            textTransform: "uppercase",
            outline: "none",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.03em",
          }}
        />
      </Group>
    </Stack>
  );
}
