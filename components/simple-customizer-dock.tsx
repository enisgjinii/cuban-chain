"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Collapse,
  Group,
  Slider,
  Stack,
  Text,
} from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import type {
  ChainConfig,
  GemstoneColors,
  Material,
  SurfaceConfig,
  SurfaceId,
  SurfaceType,
} from "@/lib/chain-config-types";
import {
  ENAMEL_COLORS,
  ENGRAVING_DESIGNS,
  MATERIAL_OPTIONS,
} from "@/lib/chain-config-types";
import { MAX_CHAIN_LINKS } from "@/lib/chain-geometry";
import { StoneColorPicker } from "@/components/stone-color-picker";
import classes from "./simple-customizer-dock.module.css";

type DockTab = "chain" | "metal" | "surface" | "detail";
type EditableSurfaceType = Extract<SurfaceType, "empty" | "gemstones" | "enamel" | "engraving">;
type EngravingPattern = "pattern1" | "pattern2";

interface SimpleCustomizerDockProps {
  chainConfig: ChainConfig;
  setChainConfig: (config: ChainConfig) => void;
  selectedSurface: SurfaceId;
  setSelectedSurface: (surface: SurfaceId) => void;
  selectedLinkIndex: number;
  setSelectedLinkIndex: (index: number) => void;
  onChainLengthChange?: (length: number) => void;
}

const TABS: Array<{ id: DockTab; label: string }> = [
  { id: "chain", label: "Chain" },
  { id: "metal", label: "Metal" },
  { id: "surface", label: "Surface" },
  { id: "detail", label: "Detail" },
];

const SURFACES: Array<{ id: SurfaceId; label: string }> = [
  { id: "top1", label: "Top 1" },
  { id: "top2", label: "Top 2" },
  { id: "side1", label: "Side 1" },
  { id: "side2", label: "Side 2" },
];

const SURFACE_TYPES: Array<{ id: EditableSurfaceType; label: string }> = [
  { id: "empty", label: "Empty" },
  { id: "gemstones", label: "Gemstones" },
  { id: "enamel", label: "Enamel" },
  { id: "engraving", label: "Engraving" },
];

function isTopSurface(surfaceId: SurfaceId): boolean {
  return surfaceId === "top1" || surfaceId === "top2";
}

function createGemstoneColors(surfaceId: SurfaceId, color = "#ffffff"): GemstoneColors {
  return isTopSurface(surfaceId)
    ? { stone1: color, stone2: color, stone3: color }
    : { stone1: color, stone2: color };
}

function normalizeGemstoneColors(surfaceId: SurfaceId, colors?: GemstoneColors): GemstoneColors {
  const fallback = createGemstoneColors(surfaceId);
  return {
    stone1: colors?.stone1 ?? fallback.stone1,
    stone2: colors?.stone2 ?? fallback.stone2,
    ...(isTopSurface(surfaceId) && { stone3: colors?.stone3 ?? fallback.stone3 }),
  };
}

function normalizeSurfaceType(type?: SurfaceType): EditableSurfaceType {
  if (type === "gemstones" || type === "enamel" || type === "engraving") {
    return type;
  }

  return "empty";
}

export function SimpleCustomizerDock({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  selectedLinkIndex,
  setSelectedLinkIndex,
  onChainLengthChange,
}: SimpleCustomizerDockProps) {
  const selectedLink = chainConfig.links[selectedLinkIndex];
  const currentSurface = selectedLink?.surfaces[selectedSurface];
  const [activeTab, setActiveTab] = useState<DockTab>("chain");
  const [material, setMaterial] = useState<Material>(selectedLink?.material ?? "silver");
  const [surfaceType, setSurfaceType] = useState<EditableSurfaceType>(
    normalizeSurfaceType(currentSurface?.type)
  );
  const [gemstoneColors, setGemstoneColors] = useState<GemstoneColors>(
    normalizeGemstoneColors(selectedSurface, currentSurface?.gemstoneColors)
  );
  const [enamelColor, setEnamelColor] = useState(currentSurface?.enamelColor ?? "#ffffff");
  const [engravingPattern, setEngravingPattern] = useState<EngravingPattern>(
    currentSurface?.engravingDesign ?? "pattern1"
  );
  const [applyToPair, setApplyToPair] = useState(false);
  const [applyToAllLinks, setApplyToAllLinks] = useState(false);
  const [applyMaterialToAllLinks, setApplyMaterialToAllLinks] = useState(false);

  const linkCount = chainConfig.links.length;
  const activeSurfaceLabel = useMemo(
    () => SURFACES.find((surface) => surface.id === selectedSurface)?.label ?? "Surface",
    [selectedSurface]
  );

  useEffect(() => {
    if (!selectedLink) {
      return;
    }

    const surface = selectedLink.surfaces[selectedSurface];
    setMaterial(selectedLink.material);
    setSurfaceType(normalizeSurfaceType(surface.type));
    setGemstoneColors(normalizeGemstoneColors(selectedSurface, surface.gemstoneColors));
    setEnamelColor(surface.enamelColor ?? "#ffffff");
    setEngravingPattern(surface.engravingDesign ?? "pattern1");
  }, [selectedLink, selectedLinkIndex, selectedSurface]);

  const applyMaterial = useCallback(
    (nextMaterial: Material) => {
      setMaterial(nextMaterial);
      setChainConfig({
        chainLength: chainConfig.chainLength,
        links: chainConfig.links.map((link, index) =>
          applyMaterialToAllLinks || index === selectedLinkIndex
            ? { ...link, material: nextMaterial }
            : link
        ),
      });
    },
    [applyMaterialToAllLinks, chainConfig, selectedLinkIndex, setChainConfig]
  );

  const buildSurfaceConfig = useCallback(
    (surfaceId: SurfaceId): SurfaceConfig => {
      switch (surfaceType) {
        case "gemstones":
          return {
            type: "gemstones",
            gemstoneColors: normalizeGemstoneColors(surfaceId, gemstoneColors),
          };
        case "enamel":
          return {
            type: "enamel",
            enamelColor,
          };
        case "engraving":
          return {
            type: "engraving",
            engravingDesign: engravingPattern,
          };
        case "empty":
        default:
          return { type: "empty" };
      }
    },
    [enamelColor, engravingPattern, gemstoneColors, surfaceType]
  );

  const applySurface = useCallback(() => {
    const targetSurfaces: SurfaceId[] = applyToPair
      ? isTopSurface(selectedSurface)
        ? ["top1", "top2"]
        : ["side1", "side2"]
      : [selectedSurface];

    setChainConfig({
      chainLength: chainConfig.chainLength,
      links: chainConfig.links.map((link, index) => {
        if (!applyToAllLinks && index !== selectedLinkIndex) {
          return link;
        }

        const surfaces = { ...link.surfaces };
        targetSurfaces.forEach((surfaceId) => {
          surfaces[surfaceId] = buildSurfaceConfig(surfaceId);
        });

        return { ...link, surfaces };
      }),
    });
  }, [
    applyToAllLinks,
    applyToPair,
    buildSurfaceConfig,
    chainConfig,
    selectedLinkIndex,
    selectedSurface,
    setChainConfig,
  ]);

  const renderTabContent = () => {
    if (activeTab === "chain") {
      return (
        <Stack gap="xs" className={classes.chainControls}>
          <Group align="center" gap="sm" wrap="nowrap">
            <ActionIcon
              aria-label="Remove link"
              size="xs"
              variant="subtle"
              onClick={() => onChainLengthChange?.(linkCount - 1)}
              disabled={linkCount <= 1}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <Slider
              value={linkCount}
              min={1}
              max={MAX_CHAIN_LINKS}
              step={1}
              size="xs"
              onChange={(value) => onChainLengthChange?.(value)}
              style={{ flex: 1 }}
            />
            <ActionIcon
              aria-label="Add link"
              size="xs"
              variant="subtle"
              onClick={() => onChainLengthChange?.(linkCount + 1)}
              disabled={linkCount >= MAX_CHAIN_LINKS}
            >
              <IconPlus size={18} />
            </ActionIcon>
            <Text size="sm" fw={700} ta="right" w={58}>
              {linkCount} links
            </Text>
          </Group>
          <Group align="center" justify="center" gap="xs">
            <Button
              size="xs"
              variant="subtle"
              className={classes.softButton}
              disabled={selectedLinkIndex === 0}
              onClick={() => setSelectedLinkIndex(Math.max(0, selectedLinkIndex - 1))}
            >
              Previous
            </Button>
            <Text size="sm" fw={700} ta="center" miw={96}>
              Link {selectedLinkIndex + 1} / {linkCount}
            </Text>
            <Button
              size="xs"
              variant="subtle"
              className={classes.softButton}
              disabled={selectedLinkIndex >= linkCount - 1}
              onClick={() => setSelectedLinkIndex(Math.min(linkCount - 1, selectedLinkIndex + 1))}
            >
              Next
            </Button>
          </Group>
        </Stack>
      );
    }

    if (activeTab === "metal") {
      return (
        <Stack gap={6} align="center">
          <Group gap="sm" justify="center">
            {MATERIAL_OPTIONS.map((option) => (
              <ActionIcon
                key={option.value}
                aria-label={option.name}
                onClick={() => applyMaterial(option.value)}
                className={`${classes.metalSwatch} ${material === option.value ? classes.metalSwatchActive : ""}`}
              >
                <span className={`${classes.metalDot} ${classes[option.value]}`} />
              </ActionIcon>
            ))}
          </Group>
          <Checkbox
            size="xs"
            checked={applyMaterialToAllLinks}
            onChange={(event) => setApplyMaterialToAllLinks(event.target.checked)}
            label="All links"
          />
        </Stack>
      );
    }

    if (activeTab === "surface") {
      return (
        <Stack gap="xs">
          <Group gap="xs" justify="center">
            {SURFACES.map((surface) => (
              <Button
                key={surface.id}
                size="xs"
                variant="outline"
                className={selectedSurface === surface.id ? classes.softButtonActive : classes.softButton}
                onClick={() => setSelectedSurface(surface.id)}
              >
                {surface.label}
              </Button>
            ))}
          </Group>
          <Group justify="center" gap="sm">
            <Checkbox
              size="xs"
              checked={applyToPair}
              onChange={(event) => setApplyToPair(event.target.checked)}
              label={isTopSurface(selectedSurface) ? "Both tops" : "Both sides"}
            />
            <Checkbox
              size="xs"
              checked={applyToAllLinks}
              onChange={(event) => setApplyToAllLinks(event.target.checked)}
              label="All links"
            />
            <Button size="xs" variant="filled" className={classes.softButtonActive} onClick={applySurface}>
              Apply
            </Button>
          </Group>
        </Stack>
      );
    }

    return (
      <Stack gap="sm" className={classes.detailControls}>
        <Group gap="xs" justify="center">
          {SURFACE_TYPES.map((type) => (
            <Button
              key={type.id}
              size="xs"
              variant="outline"
              className={surfaceType === type.id ? classes.softButtonActive : classes.softButton}
              onClick={() => setSurfaceType(type.id)}
            >
              {type.label}
            </Button>
          ))}
        </Group>
        <Collapse expanded={surfaceType === "gemstones"}>
          <StoneColorPicker
            surfaceId={selectedSurface}
            gemstoneColors={gemstoneColors}
            onChange={(colors) => setGemstoneColors(normalizeGemstoneColors(selectedSurface, colors))}
          />
        </Collapse>
        <Collapse expanded={surfaceType === "enamel"}>
          <Group gap="sm" justify="center">
            {ENAMEL_COLORS.map((option) => (
              <Button
                key={option.value}
                size="xs"
                variant="outline"
                className={enamelColor === option.value ? classes.softButtonActive : classes.softButton}
                onClick={() => setEnamelColor(option.value)}
                leftSection={
                  <Box
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: option.value,
                      border: option.value === "#ffffff" ? "1px solid rgba(0,0,0,0.3)" : "1px solid transparent",
                    }}
                  />
                }
              >
                {option.name}
              </Button>
            ))}
          </Group>
        </Collapse>
        <Collapse expanded={surfaceType === "engraving"}>
          <Group gap="sm" justify="center">
            {ENGRAVING_DESIGNS.map((option) => (
              <Button
                key={option.value}
                size="xs"
                variant="outline"
                className={engravingPattern === option.value ? classes.softButtonActive : classes.softButton}
                onClick={() => setEngravingPattern(option.value)}
              >
                {option.name}
              </Button>
            ))}
          </Group>
        </Collapse>
        <Button size="xs" variant="filled" className={classes.softButtonActive} onClick={applySurface}>
          Apply to {activeSurfaceLabel}
        </Button>
      </Stack>
    );
  };

  return (
    <Stack
      align="center"
      gap="sm"
      className={classes.root}
    >
      <Box className={classes.controlPill}>
        {renderTabContent()}
      </Box>

      <Group gap={0} wrap="nowrap" className={classes.tabPill}>
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            fullWidth
            size="xs"
            variant="subtle"
            className={`${classes.tabButton} ${activeTab === tab.id ? classes.tabButtonActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </Group>
    </Stack>
  );
}
