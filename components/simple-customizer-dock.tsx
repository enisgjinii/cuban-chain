"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  FloatingIndicator,
  Group,
  ScrollArea,
  Slider,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconChevronRight,
  IconCopy,
  IconDownload,
  IconInfoCircle,
  IconLink,
  IconMinus,
  IconPaint,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
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
import { createDefaultLink } from "@/lib/chain-helpers";
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
  onSaveDesign?: () => void;
  onLoadDesign?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TABS: Array<{ id: DockTab; label: string; hint: string }> = [
  { id: "chain", label: "Chain", hint: "How many links and which one you're editing" },
  { id: "metal", label: "Metal", hint: "Pick the metal finish for the selected link" },
  { id: "surface", label: "Surface", hint: "Choose which face of the link to customize" },
  { id: "detail", label: "Detail", hint: "Add gemstones, enamel, or engraving to the face" },
];

const SURFACES: Array<{ id: SurfaceId; label: string; hint: string }> = [
  { id: "top1", label: "Top 1", hint: "Upper facet facing the front" },
  { id: "top2", label: "Top 2", hint: "Upper facet facing the back" },
  { id: "side1", label: "Side 1", hint: "Left side facet" },
  { id: "side2", label: "Side 2", hint: "Right side facet" },
];

const SURFACE_TYPES: Array<{ id: EditableSurfaceType; label: string; hint: string }> = [
  { id: "empty", label: "Empty", hint: "Plain metal finish — no stones or paint" },
  { id: "gemstones", label: "Gemstones", hint: "Inlay sparkling colored stones" },
  { id: "enamel", label: "Enamel", hint: "Fill with a solid colored enamel paint" },
  { id: "engraving", label: "Engraving", hint: "Etch a decorative pattern into the face" },
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

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/u.test(value);
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip label={text} multiline w={240} withArrow position="top" offset={6} events={{ hover: true, focus: true, touch: true }}>
      <ActionIcon
        size="xs"
        variant="subtle"
        radius="xl"
        aria-label="More info"
        className={classes.infoButton}
      >
        <IconInfoCircle size={14} />
      </ActionIcon>
    </Tooltip>
  );
}

function SectionHeader({
  title,
  info,
  rightSlot,
}: {
  title: string;
  info: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <Group justify="space-between" align="center" gap={4} wrap="nowrap" className={classes.sectionHeader}>
      <Group gap={4} wrap="nowrap">
        <Text size="xs" fw={700} className={classes.sectionTitle}>
          {title}
        </Text>
        <InfoTip text={info} />
      </Group>
      {rightSlot}
    </Group>
  );
}

export function SimpleCustomizerDock({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  selectedLinkIndex,
  setSelectedLinkIndex,
  onChainLengthChange,
  onSaveDesign,
  onLoadDesign,
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
  const [enamelColorInput, setEnamelColorInput] = useState(currentSurface?.enamelColor ?? "#ffffff");
  const [engravingPattern, setEngravingPattern] = useState<EngravingPattern>(
    currentSurface?.engravingDesign ?? "pattern1"
  );
  const [applyToPair, setApplyToPair] = useState(false);
  const [applyToAllLinks, setApplyToAllLinks] = useState(false);
  const [applyMaterialToAllLinks, setApplyMaterialToAllLinks] = useState(false);
  const [tabsRootRef, setTabsRootRef] = useState<HTMLDivElement | null>(null);
  const [tabControlsRefs, setTabControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});

  const linkCount = chainConfig.links.length;
  const activeSurfaceLabel = useMemo(
    () => SURFACES.find((surface) => surface.id === selectedSurface)?.label ?? "Surface",
    [selectedSurface]
  );

  const tabControlRefCallbacks = useMemo(
    () =>
      TABS.reduce(
        (callbacks, tab) => {
          callbacks[tab.id] = (node: HTMLButtonElement | null) => {
            setTabControlsRefs((current) =>
              current[tab.id] === node ? current : { ...current, [tab.id]: node }
            );
          };
          return callbacks;
        },
        {} as Record<DockTab, (node: HTMLButtonElement | null) => void>
      ),
    []
  );

  useEffect(() => {
    if (!selectedLink) {
      return;
    }

    const surface = selectedLink.surfaces[selectedSurface];
    setMaterial(selectedLink.material);
    setSurfaceType(normalizeSurfaceType(surface.type));
    setGemstoneColors(normalizeGemstoneColors(selectedSurface, surface.gemstoneColors));
    const nextEnamelColor = surface.enamelColor ?? "#ffffff";
    setEnamelColor(nextEnamelColor);
    setEnamelColorInput(nextEnamelColor);
    setEngravingPattern(surface.engravingDesign ?? "pattern1");
  }, [selectedLink, selectedLinkIndex, selectedSurface]);

  const updateEnamelColor = useCallback((nextColor: string) => {
    if (!isHexColor(nextColor)) {
      return;
    }

    const normalizedColor = nextColor.toLowerCase();
    setEnamelColor(normalizedColor);
    setEnamelColorInput(normalizedColor);
  }, []);

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

  const copyLinkToAll = useCallback(() => {
    const source = chainConfig.links[selectedLinkIndex];
    if (!source) return;
    setChainConfig({
      chainLength: chainConfig.chainLength,
      links: chainConfig.links.map(() => ({
        material: source.material,
        surfaces: {
          top1: { ...source.surfaces.top1 },
          top2: { ...source.surfaces.top2 },
          side1: { ...source.surfaces.side1 },
          side2: { ...source.surfaces.side2 },
        },
      })),
    });
  }, [chainConfig, selectedLinkIndex, setChainConfig]);

  const resetLink = useCallback(() => {
    const fresh = createDefaultLink();
    setChainConfig({
      chainLength: chainConfig.chainLength,
      links: chainConfig.links.map((link, index) =>
        index === selectedLinkIndex ? fresh : link
      ),
    });
  }, [chainConfig, selectedLinkIndex, setChainConfig]);

  const resetAll = useCallback(() => {
    setChainConfig({
      chainLength: chainConfig.chainLength,
      links: chainConfig.links.map(() => createDefaultLink()),
    });
  }, [chainConfig.chainLength, chainConfig.links, setChainConfig]);

  const surfaceTypeLabel = useMemo(() => {
    return SURFACE_TYPES.find((type) => type.id === surfaceType)?.label ?? "Empty";
  }, [surfaceType]);

  const renderBreadcrumb = () => (
    <Group gap={4} wrap="nowrap" className={classes.breadcrumb} align="center">
      <IconLink size={12} />
      <Text size="xs" fw={700}>
        Link {selectedLinkIndex + 1}
      </Text>
      <IconChevronRight size={12} style={{ opacity: 0.5 }} />
      <Text size="xs" fw={700}>
        {activeSurfaceLabel}
      </Text>
      <IconChevronRight size={12} style={{ opacity: 0.5 }} />
      <Text size="xs" c="dimmed" fw={600}>
        {surfaceTypeLabel}
      </Text>
    </Group>
  );

  const renderTabContent = () => {
    if (activeTab === "chain") {
      return (
        <Stack gap={10} className={classes.chainControls}>
          <SectionHeader
            title="Chain length"
            info="Drag the slider or use ± to change how many links your chain has. Max 25."
            rightSlot={
              <Text size="xs" fw={800} className={classes.countBadge}>
                {linkCount} / {MAX_CHAIN_LINKS}
              </Text>
            }
          />
          <Group align="center" gap="xs" wrap="nowrap">
            <Tooltip label="Remove one link" withArrow>
              <ActionIcon
                aria-label="Remove link"
                size="md"
                variant="subtle"
                className={classes.circleButton}
                onClick={() => onChainLengthChange?.(linkCount - 1)}
                disabled={linkCount <= 1}
              >
                <IconMinus size={16} />
              </ActionIcon>
            </Tooltip>
            <Slider
              value={linkCount}
              min={1}
              max={MAX_CHAIN_LINKS}
              step={1}
              size="sm"
              label={(value) => `${value} links`}
              onChange={(value) => onChainLengthChange?.(value)}
              style={{ flex: 1 }}
            />
            <Tooltip label="Add one link" withArrow>
              <ActionIcon
                aria-label="Add link"
                size="md"
                variant="subtle"
                className={classes.circleButton}
                onClick={() => onChainLengthChange?.(linkCount + 1)}
                disabled={linkCount >= MAX_CHAIN_LINKS}
              >
                <IconPlus size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Divider className={classes.softDivider} />

          <SectionHeader
            title="Select a link"
            info="Navigate between links. You can also click directly on a link in the 3D view."
          />
          <Group align="center" gap="xs" justify="space-between" wrap="nowrap">
            <Tooltip label="Previous link" withArrow>
              <ActionIcon
                size="md"
                variant="subtle"
                className={classes.circleButton}
                disabled={selectedLinkIndex === 0}
                onClick={() => setSelectedLinkIndex(Math.max(0, selectedLinkIndex - 1))}
                aria-label="Previous link"
              >
                <IconArrowLeft size={16} />
              </ActionIcon>
            </Tooltip>
            <Text size="sm" fw={800} ta="center" style={{ flex: 1 }}>
              Link {selectedLinkIndex + 1}
              <Text component="span" size="xs" c="dimmed" fw={600}>
                {" "}
                of {linkCount}
              </Text>
            </Text>
            <Tooltip label="Next link" withArrow>
              <ActionIcon
                size="md"
                variant="subtle"
                className={classes.circleButton}
                disabled={selectedLinkIndex >= linkCount - 1}
                onClick={() => setSelectedLinkIndex(Math.min(linkCount - 1, selectedLinkIndex + 1))}
                aria-label="Next link"
              >
                <IconArrowRight size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Group gap="xs" grow wrap="wrap">
            <Tooltip label="Copy this link's look (metal + all faces) to every other link in the chain" multiline w={240} withArrow>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconCopy size={14} />}
                className={classes.softButton}
                onClick={copyLinkToAll}
              >
                Copy to all links
              </Button>
            </Tooltip>
            <Tooltip label="Reset the chain to plain silver, no gemstones, no enamel, no engraving" multiline w={240} withArrow>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                className={classes.softButton}
                onClick={resetAll}
              >
                Reset chain
              </Button>
            </Tooltip>
          </Group>

          <Divider className={classes.softDivider} />

          <SectionHeader
            title="Save design"
            info="Export your chain configuration as a JSON file, or load a previously saved design."
          />
          <Group gap="xs" grow wrap="wrap">
            <Tooltip label="Download the current design as a .json file" withArrow>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconDownload size={14} />}
                className={classes.softButton}
                onClick={onSaveDesign}
                disabled={!onSaveDesign}
              >
                Save to file
              </Button>
            </Tooltip>
            <Tooltip label="Load a design from a .json file" withArrow>
              <Button
                size="xs"
                variant="light"
                component="label"
                leftSection={<IconUpload size={14} />}
                className={classes.softButton}
                disabled={!onLoadDesign}
              >
                Load from file
                <input type="file" accept=".json,application/json" hidden onChange={onLoadDesign} />
              </Button>
            </Tooltip>
          </Group>
        </Stack>
      );
    }

    if (activeTab === "metal") {
      return (
        <Stack gap={10} align="stretch">
          <SectionHeader
            title="Metal finish"
            info="Pick the base metal for this link. Toggle 'All links' to recolor the whole chain at once."
          />
          <Group gap="sm" justify="center" wrap="wrap">
            {MATERIAL_OPTIONS.map((option) => (
              <Tooltip key={option.value} label={option.name} withArrow position="top">
                <ActionIcon
                  aria-label={option.name}
                  onClick={() => applyMaterial(option.value)}
                  className={`${classes.metalSwatch} ${material === option.value ? classes.metalSwatchActive : ""}`}
                >
                  <span className={`${classes.metalDot} ${classes[option.value]}`} />
                </ActionIcon>
              </Tooltip>
            ))}
          </Group>
          <Group justify="center" gap="sm">
            <Checkbox
              size="xs"
              checked={applyMaterialToAllLinks}
              onChange={(event) => setApplyMaterialToAllLinks(event.target.checked)}
              label="Apply to all links"
            />
            <InfoTip text="When checked, choosing a metal will change every link in the chain. When unchecked, only the selected link changes." />
          </Group>
          <Tooltip label="Reset only the selected link back to plain silver" withArrow>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconRefresh size={14} />}
              className={classes.softButton}
              onClick={resetLink}
            >
              Reset this link
            </Button>
          </Tooltip>
        </Stack>
      );
    }

    if (activeTab === "surface") {
      return (
        <Stack gap={10}>
          <SectionHeader
            title="Choose a face"
            info="Every link has 4 faces you can customize: two tops and two sides. Pick one, then head to Detail to style it."
          />
          <Group gap="xs" justify="center" wrap="wrap">
            {SURFACES.map((surface) => (
              <Tooltip key={surface.id} label={surface.hint} multiline w={200} withArrow>
                <Button
                  size="xs"
                  variant="outline"
                  className={selectedSurface === surface.id ? classes.softButtonActive : classes.softButton}
                  onClick={() => setSelectedSurface(surface.id)}
                >
                  {surface.label}
                </Button>
              </Tooltip>
            ))}
          </Group>

          <Divider className={classes.softDivider} />

          <SectionHeader
            title="Scope"
            info="Choose how widely the next change will apply. Defaults to only the selected face on the selected link."
          />
          <Stack gap={6} align="stretch">
            <Group gap={6} wrap="nowrap">
              <Checkbox
                size="xs"
                checked={applyToPair}
                onChange={(event) => setApplyToPair(event.target.checked)}
                label={isTopSurface(selectedSurface) ? "Both tops" : "Both sides"}
              />
              <InfoTip
                text={
                  isTopSurface(selectedSurface)
                    ? "Apply the change to Top 1 AND Top 2 of this link at once."
                    : "Apply the change to Side 1 AND Side 2 of this link at once."
                }
              />
            </Group>
            <Group gap={6} wrap="nowrap">
              <Checkbox
                size="xs"
                checked={applyToAllLinks}
                onChange={(event) => setApplyToAllLinks(event.target.checked)}
                label="All links"
              />
              <InfoTip text="Apply the change to every link in the chain — useful for a uniform pattern." />
            </Group>
          </Stack>

          <Tooltip label="Go to Detail to pick gemstones, enamel or engraving" withArrow>
            <Button
              size="sm"
              variant="filled"
              fullWidth
              className={classes.softButtonActive}
              rightSection={<IconChevronRight size={16} />}
              onClick={() => setActiveTab("detail")}
            >
              Style this face
            </Button>
          </Tooltip>
        </Stack>
      );
    }

    return (
      <Stack gap={10} className={classes.detailControls}>
        <SectionHeader
          title="Face style"
          info="Pick what fills the selected face. Changes preview instantly but only save when you press Apply."
        />
        <Group gap="xs" justify="center" wrap="wrap">
          {SURFACE_TYPES.map((type) => (
            <Tooltip key={type.id} label={type.hint} multiline w={220} withArrow>
              <Button
                size="xs"
                variant="outline"
                leftSection={
                  type.id === "gemstones" ? (
                    <IconSparkles size={12} />
                  ) : type.id === "enamel" ? (
                    <IconPaint size={12} />
                  ) : null
                }
                className={surfaceType === type.id ? classes.softButtonActive : classes.softButton}
                onClick={() => setSurfaceType(type.id)}
              >
                {type.label}
              </Button>
            </Tooltip>
          ))}
        </Group>

        <Collapse expanded={surfaceType === "gemstones"}>
          <Stack gap={8}>
            <SectionHeader
              title="Gemstones"
              info={
                isTopSurface(selectedSurface)
                  ? "Top faces hold 3 stones. Click a stone, then pick its color — or use 'Apply to all' to sync them."
                  : "Side faces hold 2 stones. Click a stone, then pick its color — or use 'Apply to all' to sync them."
              }
            />
            <StoneColorPicker
              surfaceId={selectedSurface}
              gemstoneColors={gemstoneColors}
              onChange={(colors) => setGemstoneColors(normalizeGemstoneColors(selectedSurface, colors))}
            />
          </Stack>
        </Collapse>

        <Collapse expanded={surfaceType === "enamel"}>
          <Stack gap={8}>
            <SectionHeader
              title="Enamel color"
              info="A solid colored paint fill that sits flat in the facet."
            />
            <Box className={classes.enamelGrid}>
              {ENAMEL_COLORS.map((option) => (
                <Tooltip key={option.value} label={option.name} withArrow>
                  <button
                    type="button"
                    aria-label={option.name}
                    onClick={() => updateEnamelColor(option.value)}
                    className={`${classes.enamelSwatch} ${enamelColor === option.value ? classes.enamelSwatchActive : ""}`}
                    style={{ background: option.value }}
                  />
                </Tooltip>
              ))}
            </Box>
            <Group gap={8} wrap="nowrap" align="flex-end">
              <Tooltip label="Pick a custom enamel color" withArrow>
                <input
                  type="color"
                  aria-label="Custom enamel color"
                  value={isHexColor(enamelColor) ? enamelColor : "#ffffff"}
                  onChange={(event) => updateEnamelColor(event.currentTarget.value)}
                  className={classes.enamelColorInput}
                />
              </Tooltip>
              <TextInput
                size="xs"
                label="Custom hex"
                value={enamelColorInput}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value.trim();
                  setEnamelColorInput(nextValue);
                  if (isHexColor(nextValue)) {
                    setEnamelColor(nextValue.toLowerCase());
                  }
                }}
                onBlur={() => setEnamelColorInput(enamelColor)}
                error={isHexColor(enamelColorInput) ? null : "Use #RRGGBB"}
                classNames={{
                  root: classes.enamelHexRoot,
                  input: classes.enamelHexInput,
                  label: classes.enamelHexLabel,
                }}
              />
            </Group>
          </Stack>
        </Collapse>

        <Collapse expanded={surfaceType === "engraving"}>
          <Stack gap={8}>
            <SectionHeader
              title="Engraving pattern"
              info="A decorative pattern etched into the metal."
            />
            <Group gap="sm" justify="center" wrap="wrap">
              {ENGRAVING_DESIGNS.map((option) => (
                <Tooltip key={option.value} label={option.name} withArrow>
                  <Button
                    size="xs"
                    variant="outline"
                    className={engravingPattern === option.value ? classes.softButtonActive : classes.softButton}
                    onClick={() => setEngravingPattern(option.value)}
                  >
                    {option.name}
                  </Button>
                </Tooltip>
              ))}
            </Group>
          </Stack>
        </Collapse>

        <Divider className={classes.softDivider} />

        <Stack gap={6}>
          <Group gap={6} wrap="nowrap">
            <Checkbox
              size="xs"
              checked={applyToPair}
              onChange={(event) => setApplyToPair(event.target.checked)}
              label={isTopSurface(selectedSurface) ? "Both tops" : "Both sides"}
            />
            <InfoTip
              text={
                isTopSurface(selectedSurface)
                  ? "Save to both top faces of this link."
                  : "Save to both side faces of this link."
              }
            />
          </Group>
          <Group gap={6} wrap="nowrap">
            <Checkbox
              size="xs"
              checked={applyToAllLinks}
              onChange={(event) => setApplyToAllLinks(event.target.checked)}
              label="All links"
            />
            <InfoTip text="Save this exact face styling to every link in the chain." />
          </Group>
        </Stack>

        <Tooltip label={`Save these settings to ${activeSurfaceLabel}${applyToPair ? " and its pair" : ""}${applyToAllLinks ? ", on every link" : ""}`} multiline w={240} withArrow>
          <Button
            size="sm"
            variant="filled"
            fullWidth
            className={classes.softButtonActive}
            onClick={applySurface}
          >
            Apply to {activeSurfaceLabel}
          </Button>
        </Tooltip>
      </Stack>
    );
  };

  return (
    <Stack align="center" gap={8} className={classes.root}>
      <Box className={classes.controlPill}>
        <Group justify="space-between" align="center" wrap="nowrap" className={classes.topBar}>
          {renderBreadcrumb()}
          <InfoTip text="Your current editing target. Tap a link on the 3D model or use Chain › Select a link to change it." />
        </Group>
        <Divider className={classes.softDivider} my={6} />
        <ScrollArea.Autosize mah="52dvh" type="hover" scrollbarSize={6} className={classes.contentScroll}>
          {/* key forces remount → CSS animation fires on every tab switch */}
          <Box key={activeTab} p={0} className={classes.tabContent}>{renderTabContent()}</Box>
        </ScrollArea.Autosize>
      </Box>

      <Tabs
        variant="none"
        value={activeTab}
        onChange={(value) => value && setActiveTab(value as DockTab)}
        className={classes.tabs}
      >
        <Tabs.List ref={setTabsRootRef} className={`${classes.tabPill} ${classes.tabsList}`}>
          {TABS.map((tab) => (
            <Tooltip key={tab.id} label={tab.hint} withArrow openDelay={250} position="top" multiline w={220}>
              <Tabs.Tab
                value={tab.id}
                ref={tabControlRefCallbacks[tab.id]}
                className={classes.floatingTab}
              >
                {tab.label}
              </Tabs.Tab>
            </Tooltip>
          ))}

          <FloatingIndicator
            target={tabControlsRefs[activeTab] ?? null}
            parent={tabsRootRef}
            className={classes.floatingIndicator}
          />
        </Tabs.List>
      </Tabs>
    </Stack>
  );
}
