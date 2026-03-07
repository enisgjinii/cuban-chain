"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  AutoAwesome,
  CameraAlt,
  ContentCopy,
  ContentPaste,
  DeleteOutline,
  Diamond,
  Edit,
  Link as LinkIcon,
  LibraryAdd,
  Palette,
  Replay,
  Share,
  Videocam,
  Stop,
} from "@mui/icons-material";

import { FavoritesPanel } from "@/components/favorites-panel";
import { PriceCalculator } from "@/components/price-calculator";
import { StoneColorPicker } from "@/components/stone-color-picker";
import { useThemeMode } from "@/components/mui-theme-registry";
import type {
  ChainConfig,
  Material,
  SurfaceConfig,
  SurfaceId,
  SurfaceType,
} from "@/lib/chain-config-types";
import {
  applyMaterialToAllLinks,
  applySurfaceToAllLinks,
  createDefaultGemstoneColors,
  updateLinkMaterial,
  updateSurface,
} from "@/lib/chain-helpers";
import {
  CHAIN_PRESETS,
  type ChainLinkType,
  URL_TO_LINK_TYPE,
} from "@/lib/chain-manager";

interface CustomizerPanelProps {
  chainConfig: ChainConfig;
  setChainConfig: (config: ChainConfig) => void;
  selectedSurface: SurfaceId;
  setSelectedSurface: (surface: SurfaceId) => void;
  selectedLinkIndex: number;
  setSelectedLinkIndex: (index: number) => void;
  onSaveConfiguration: () => void;
  onLoadConfiguration: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptureImage?: () => void;
  onStartRecording?: () => void;
  isRecording?: boolean;
  modelUrls: string[];
  onChainLengthChange?: (length: number) => void;
  onLoadFavorite?: (config: ChainConfig, urls: string[]) => void;
  autoRotate?: boolean;
  setAutoRotate?: (value: boolean) => void;
  background?:
    | "city"
    | "studio"
    | "sunset"
    | "dawn"
    | "night"
    | "warehouse"
    | "forest"
    | "apartment"
    | "park"
    | "lobby";
  setBackground?: (
    bg:
      | "city"
      | "studio"
      | "sunset"
      | "dawn"
      | "night"
      | "warehouse"
      | "forest"
      | "apartment"
      | "park"
      | "lobby"
  ) => void;
  onDuplicateSelectedLink?: () => void;
  onRemoveSelectedLink?: () => void;
  onAddLinkType?: (linkType: ChainLinkType) => void;
  onReplaceSelectedLinkType?: (linkType: ChainLinkType) => void;
  onLoadPreset?: (presetName: string) => void;
  onCopySelectedLink?: () => void;
  onPasteToSelectedLink?: () => void;
  onResetSelectedLink?: () => void;
  onReplayAnimation?: () => void;
}

const MATERIALS: { label: string; value: Material; color: string }[] = [
  { label: "Silver", value: "silver", color: "#c7c8cc" },
  { label: "Gold", value: "gold", color: "#f4c21c" },
  { label: "Grey", value: "grey", color: "#7a7a7d" },
  { label: "Black", value: "black", color: "#1d1d1f" },
  { label: "White", value: "white", color: "#f4f4f2" },
];

const SURFACE_TYPES: { label: string; value: SurfaceType; icon: React.ReactNode }[] = [
  { label: "Diamonds", value: "gemstones", icon: <Diamond sx={{ fontSize: 16 }} /> },
  { label: "Moissanite", value: "moissanites", icon: <AutoAwesome sx={{ fontSize: 16 }} /> },
  { label: "Enamel", value: "enamel", icon: <Palette sx={{ fontSize: 16 }} /> },
  { label: "Engraving", value: "engraving", icon: <Edit sx={{ fontSize: 16 }} /> },
];

const SURFACE_OPTIONS: { label: string; value: SurfaceId }[] = [
  { label: "Top 1", value: "top1" },
  { label: "Top 2", value: "top2" },
  { label: "Side 1", value: "side1" },
  { label: "Side 2", value: "side2" },
];

const COLOR_OPTIONS = [
  { label: "Colourless", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#ea580c" },
];

const ENGRAVING_PATTERNS = [
  { label: "Pattern 1", value: "pattern1" },
  { label: "Pattern 2", value: "pattern2" },
];

const AVAILABLE_LINK_TYPES: { value: ChainLinkType; label: string }[] = [
  { value: "cuban-main", label: "Cuban Main" },
  { value: "cuban-top-flat", label: "Top Flat" },
  { value: "cuban-top-diamond", label: "Top Diamond" },
  { value: "cuban-top-engraving", label: "Top Engraving" },
  { value: "cuban-top-filling", label: "Top Filling" },
  { value: "cuban-top-cavity", label: "Top Cavity" },
  { value: "cuban-top-cavity-diamond", label: "Top Cavity Diamond" },
  { value: "cuban-side-flat", label: "Side Flat" },
  { value: "cuban-side-diamond", label: "Side Diamond" },
  { value: "cuban-side-engraving", label: "Side Engraving" },
  { value: "cuban-side-filling", label: "Side Filling" },
  { value: "cuban-side-cavity", label: "Side Cavity" },
  { value: "cuban-side-cavity-diamond", label: "Side Cavity Diamond" },
];

const ENVIRONMENTS = [
  { label: "City", value: "city" },
  { label: "Studio", value: "studio" },
  { label: "Sunset", value: "sunset" },
  { label: "Dawn", value: "dawn" },
  { label: "Night", value: "night" },
  { label: "Warehouse", value: "warehouse" },
  { label: "Forest", value: "forest" },
  { label: "Apartment", value: "apartment" },
  { label: "Park", value: "park" },
  { label: "Lobby", value: "lobby" },
];

function ThemeToggleRow() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2">{mode === "dark" ? "Dark mode" : "Light mode"}</Typography>
      <Switch size="small" checked={mode === "dark"} onChange={toggleTheme} />
    </Stack>
  );
}

function PanelSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        p: 1.5,
        bgcolor: "background.default",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25, mb: 1.25 }}>
          {subtitle}
        </Typography>
      )}
      {children}
    </Box>
  );
}

export function CustomizerPanel({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  selectedLinkIndex,
  setSelectedLinkIndex,
  onSaveConfiguration,
  onLoadConfiguration,
  onCaptureImage,
  onStartRecording,
  isRecording = false,
  modelUrls,
  onChainLengthChange,
  onLoadFavorite,
  autoRotate = false,
  setAutoRotate,
  background = "city",
  setBackground,
  onDuplicateSelectedLink,
  onRemoveSelectedLink,
  onAddLinkType,
  onReplaceSelectedLinkType,
  onLoadPreset,
  onCopySelectedLink,
  onPasteToSelectedLink,
  onResetSelectedLink,
  onReplayAnimation,
}: CustomizerPanelProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [applyToAll, setApplyToAll] = useState(false);
  const [addLinkType, setAddLinkType] = useState<ChainLinkType>("cuban-main");

  const linkCount = modelUrls.length;
  const currentLink = chainConfig.links[selectedLinkIndex];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  const selectedLinkType = (URL_TO_LINK_TYPE[modelUrls[selectedLinkIndex]] ?? "cuban-main") as ChainLinkType;
  const isSurfaceEnabled = currentSurfaceConfig?.type !== "empty";
  const defaultGemstoneColors = useMemo(
    () => createDefaultGemstoneColors(selectedSurface) ?? { stone1: "#ffffff", stone2: "#ffffff" },
    [selectedSurface]
  );

  useEffect(() => {
    setAddLinkType(selectedLinkType);
  }, [selectedLinkType]);

  const applySurfaceConfig = useCallback(
    (surfaceConfig: SurfaceConfig) => {
      if (applyToAll) {
        setChainConfig(applySurfaceToAllLinks(chainConfig, selectedSurface, surfaceConfig));
        return;
      }

      setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, surfaceConfig));
    },
    [applyToAll, chainConfig, selectedLinkIndex, selectedSurface, setChainConfig]
  );

  const handleMaterialChange = useCallback(
    (material: Material) => {
      if (applyToAll) {
        setChainConfig(applyMaterialToAllLinks(chainConfig, material));
        return;
      }

      setChainConfig(updateLinkMaterial(chainConfig, selectedLinkIndex, material));
    },
    [applyToAll, chainConfig, selectedLinkIndex, setChainConfig]
  );

  const handleToggleSurface = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        applySurfaceConfig({ type: "empty" });
        return;
      }

      applySurfaceConfig({
        type: "gemstones",
        gemstoneColors: defaultGemstoneColors,
      });
    },
    [applySurfaceConfig, defaultGemstoneColors]
  );

  const handleSurfaceTypeChange = useCallback(
    (surfaceType: SurfaceType) => {
      let nextConfig: SurfaceConfig = { type: surfaceType };

      if (surfaceType === "gemstones" || surfaceType === "moissanites") {
        nextConfig = {
          type: surfaceType,
          gemstoneColors: currentSurfaceConfig?.gemstoneColors ?? defaultGemstoneColors,
        };
      } else if (surfaceType === "enamel") {
        nextConfig = {
          type: surfaceType,
          enamelColor: currentSurfaceConfig?.enamelColor ?? "#ffffff",
        };
      } else if (surfaceType === "engraving") {
        nextConfig = {
          type: surfaceType,
          engravingDesign: currentSurfaceConfig?.engravingDesign ?? "pattern1",
        };
      }

      applySurfaceConfig(nextConfig);
    },
    [applySurfaceConfig, currentSurfaceConfig, defaultGemstoneColors]
  );

  const handleColorChange = useCallback(
    (value: string) => {
      if (!currentSurfaceConfig) {
        return;
      }

      if (currentSurfaceConfig.type === "gemstones" || currentSurfaceConfig.type === "moissanites") {
        applySurfaceConfig({
          ...currentSurfaceConfig,
          gemstoneColors: {
            stone1: value,
            stone2: value,
            ...(selectedSurface === "top1" || selectedSurface === "top2" ? { stone3: value } : {}),
          },
        });
        return;
      }

      if (currentSurfaceConfig.type === "enamel") {
        applySurfaceConfig({ ...currentSurfaceConfig, enamelColor: value });
        return;
      }

      if (currentSurfaceConfig.type === "engraving") {
        applySurfaceConfig({
          ...currentSurfaceConfig,
          engravingDesign: value as "pattern1" | "pattern2",
        });
      }
    },
    [applySurfaceConfig, currentSurfaceConfig, selectedSurface]
  );

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My Cuban chain",
          text: "Check out this Cuban chain design.",
          url: window.location.href,
        });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
      }
    }

    await navigator.clipboard.writeText(window.location.href);
  }, []);

  const surfaceDescription = useMemo(() => {
    if (!currentSurfaceConfig || currentSurfaceConfig.type === "empty") {
      return "Inactive";
    }
    return currentSurfaceConfig.type;
  }, [currentSurfaceConfig]);

  const renderColorControls = () => {
    if (!currentSurfaceConfig || currentSurfaceConfig.type === "empty") {
      return null;
    }

    if (currentSurfaceConfig.type === "engraving") {
      return (
        <FormControl fullWidth size="small">
          <InputLabel>Pattern</InputLabel>
          <Select
            label="Pattern"
            value={currentSurfaceConfig.engravingDesign ?? "pattern1"}
            onChange={(event) => handleColorChange(event.target.value)}
          >
            {ENGRAVING_PATTERNS.map((pattern) => (
              <MenuItem key={pattern.value} value={pattern.value}>
                {pattern.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    const currentValue =
      currentSurfaceConfig.type === "enamel"
        ? currentSurfaceConfig.enamelColor ?? "#ffffff"
        : currentSurfaceConfig.gemstoneColors?.stone1 ?? "#ffffff";

    return (
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
          Quick color
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {COLOR_OPTIONS.map((option) => (
            <Box
              key={option.value}
              className={`swatch-btn ${currentValue === option.value ? "active" : ""}`}
              onClick={() => handleColorChange(option.value)}
              sx={{
                bgcolor: option.value,
                border: option.value === "#ffffff" ? "2px solid #444" : undefined,
              }}
              title={option.label}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box sx={{ px: 2.25, pt: 2.25, pb: 1.25 }}>
        <Typography variant="overline" sx={{ letterSpacing: "0.16em", color: "text.secondary" }}>
          Customize
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Cuban chain sidebar
        </Typography>
        <PriceCalculator chainConfig={chainConfig} chainLength={linkCount} />
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(_, nextValue) => setTabIndex(nextValue)}
        variant="fullWidth"
        sx={{ minHeight: 44, px: 1, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab label="Design" />
        <Tab label="Links" />
        <Tab label="Saved" />
        <Tab label="View" />
      </Tabs>

      <Box className="custom-scrollbar" sx={{ flex: 1, overflowY: "auto", px: 2.25, py: 2 }}>
        {tabIndex === 0 && (
          <Stack spacing={1.5}>
            <PanelSection title="Selected link" subtitle="One shared selection now drives the viewer and sidebar.">
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={selectedLinkIndex === 0}
                  onClick={() => setSelectedLinkIndex(Math.max(0, selectedLinkIndex - 1))}
                >
                  Prev
                </Button>
                <Box sx={{ textAlign: "center", minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Link {selectedLinkIndex + 1} of {linkCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "capitalize" }}>
                    {selectedLinkType.replace("cuban-", "").replaceAll("-", " ")}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={selectedLinkIndex >= linkCount - 1}
                  onClick={() => setSelectedLinkIndex(Math.min(linkCount - 1, selectedLinkIndex + 1))}
                >
                  Next
                </Button>
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={applyToAll}
                    onChange={(event) => setApplyToAll(event.target.checked)}
                  />
                }
                label={<Typography variant="caption">Apply edits to all links</Typography>}
                sx={{ mt: 0.75 }}
              />
            </PanelSection>

            <PanelSection title="Material">
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                {MATERIALS.map((material) => (
                  <Box key={material.value} sx={{ textAlign: "center", flex: 1 }}>
                    <Box
                      onClick={() => handleMaterialChange(material.value)}
                      sx={{
                        width: 38,
                        height: 38,
                        mx: "auto",
                        borderRadius: "50%",
                        bgcolor: material.color,
                        border: currentLink?.material === material.value ? "3px solid" : "1px solid",
                        borderColor: currentLink?.material === material.value ? "primary.main" : "divider",
                        cursor: "pointer",
                        boxShadow:
                          currentLink?.material === material.value
                            ? "0 0 0 3px rgba(212,160,23,0.18)"
                            : "none",
                      }}
                    />
                    <Typography variant="caption" sx={{ mt: 0.75, display: "block" }}>
                      {material.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </PanelSection>

            <PanelSection title="Surface" subtitle={`Editing ${selectedSurface.toUpperCase()} • ${surfaceDescription}`}>
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mb: 1.25 }}>
                {SURFACE_OPTIONS.map((surface) => (
                  <Chip
                    key={surface.value}
                    label={surface.label}
                    onClick={() => setSelectedSurface(surface.value)}
                    color={selectedSurface === surface.value ? "primary" : "default"}
                    variant={selectedSurface === surface.value ? "filled" : "outlined"}
                    size="small"
                  />
                ))}
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                <Typography variant="body2">Enable surface design</Typography>
                <Switch
                  size="small"
                  checked={isSurfaceEnabled}
                  onChange={(event) => handleToggleSurface(event.target.checked)}
                />
              </Stack>

              {isSurfaceEnabled && (
                <Stack spacing={1.25}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                    {SURFACE_TYPES.map((surfaceType) => {
                      const active = currentSurfaceConfig?.type === surfaceType.value;
                      return (
                        <Button
                          key={surfaceType.value}
                          variant={active ? "contained" : "outlined"}
                          onClick={() => handleSurfaceTypeChange(surfaceType.value)}
                          startIcon={surfaceType.icon}
                          sx={{ justifyContent: "flex-start" }}
                        >
                          {surfaceType.label}
                        </Button>
                      );
                    })}
                  </Box>

                  {renderColorControls()}

                  {(currentSurfaceConfig?.type === "gemstones" ||
                    currentSurfaceConfig?.type === "moissanites") && (
                    <StoneColorPicker
                      surfaceId={selectedSurface}
                      gemstoneColors={currentSurfaceConfig.gemstoneColors ?? defaultGemstoneColors}
                      onChange={(gemstoneColors) =>
                        applySurfaceConfig({
                          ...currentSurfaceConfig,
                          gemstoneColors,
                        })
                      }
                    />
                  )}
                </Stack>
              )}
            </PanelSection>
          </Stack>
        )}

        {tabIndex === 1 && (
          <Stack spacing={1.5}>
            <PanelSection title="Chain length">
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={linkCount <= 1}
                  onClick={() => onChainLengthChange?.(linkCount - 1)}
                >
                  Remove one
                </Button>
                <Chip label={`${linkCount} total`} color="primary" variant="outlined" />
                <Button variant="outlined" fullWidth onClick={() => onChainLengthChange?.(linkCount + 1)}>
                  Add one
                </Button>
              </Stack>
            </PanelSection>

            <PanelSection title="Selected link actions">
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                <Button variant="outlined" startIcon={<LibraryAdd />} onClick={onDuplicateSelectedLink}>
                  Duplicate
                </Button>
                <Button variant="outlined" startIcon={<DeleteOutline />} onClick={onRemoveSelectedLink}>
                  Remove
                </Button>
                <Button variant="outlined" startIcon={<ContentCopy />} onClick={onCopySelectedLink}>
                  Copy
                </Button>
                <Button variant="outlined" startIcon={<ContentPaste />} onClick={onPasteToSelectedLink}>
                  Paste
                </Button>
              </Box>
              <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={onResetSelectedLink}>
                Reset selected link
              </Button>
            </PanelSection>

            <PanelSection title="Link types">
              <Stack spacing={1.25}>
                <FormControl fullWidth size="small">
                  <InputLabel>Selected link type</InputLabel>
                  <Select
                    label="Selected link type"
                    value={selectedLinkType}
                    onChange={(event) =>
                      onReplaceSelectedLinkType?.(event.target.value as ChainLinkType)
                    }
                  >
                    {AVAILABLE_LINK_TYPES.map((linkType) => (
                      <MenuItem key={linkType.value} value={linkType.value}>
                        {linkType.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={1}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Add link type</InputLabel>
                    <Select
                      label="Add link type"
                      value={addLinkType}
                      onChange={(event) => setAddLinkType(event.target.value as ChainLinkType)}
                    >
                      {AVAILABLE_LINK_TYPES.map((linkType) => (
                        <MenuItem key={linkType.value} value={linkType.value}>
                          {linkType.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={() => onAddLinkType?.(addLinkType)}>
                    Add
                  </Button>
                </Stack>
              </Stack>
            </PanelSection>

            <PanelSection title="Quick presets">
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                {Object.keys(CHAIN_PRESETS).map((presetName) => (
                  <Button
                    key={presetName}
                    variant="outlined"
                    startIcon={<LinkIcon />}
                    onClick={() => onLoadPreset?.(presetName)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {presetName}
                  </Button>
                ))}
              </Box>
            </PanelSection>
          </Stack>
        )}

        {tabIndex === 2 && (
          <Stack spacing={1.5}>
            <PanelSection title="Saved designs" subtitle="Browser-stored favorites plus JSON export and import.">
              <FavoritesPanel
                chainConfig={chainConfig}
                modelUrls={modelUrls}
                onLoadFavorite={(config, urls) => onLoadFavorite?.(config, urls)}
              />
            </PanelSection>

            <PanelSection title="Backup">
              <Stack spacing={1}>
                <Button fullWidth variant="outlined" onClick={onSaveConfiguration}>
                  Save JSON
                </Button>
                <Button fullWidth variant="outlined" component="label">
                  Load JSON
                  <input type="file" accept=".json" hidden onChange={onLoadConfiguration} />
                </Button>
              </Stack>
            </PanelSection>
          </Stack>
        )}

        {tabIndex === 3 && (
          <Stack spacing={1.5}>
            <PanelSection title="Capture">
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                <Button variant="outlined" startIcon={<CameraAlt />} onClick={onCaptureImage}>
                  Capture
                </Button>
                <Button
                  variant={isRecording ? "contained" : "outlined"}
                  color={isRecording ? "error" : "primary"}
                  startIcon={isRecording ? <Stop /> : <Videocam />}
                  onClick={onStartRecording}
                >
                  {isRecording ? "Stop" : "Record"}
                </Button>
              </Box>
              <Button fullWidth variant="text" sx={{ mt: 1 }} startIcon={<Share />} onClick={handleShare}>
                Share current page
              </Button>
            </PanelSection>

            <PanelSection title="Display">
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Auto rotate</Typography>
                  <Switch
                    size="small"
                    checked={autoRotate}
                    onChange={(event) => setAutoRotate?.(event.target.checked)}
                  />
                </Stack>
                <ThemeToggleRow />
                <Divider />
                <FormControl fullWidth size="small">
                  <InputLabel>Environment</InputLabel>
                  <Select
                    label="Environment"
                    value={background}
                    onChange={(event) =>
                      setBackground?.(
                        event.target.value as
                          | "city"
                          | "studio"
                          | "sunset"
                          | "dawn"
                          | "night"
                          | "warehouse"
                          | "forest"
                          | "apartment"
                          | "park"
                          | "lobby"
                      )
                    }
                  >
                    {ENVIRONMENTS.map((environment) => (
                      <MenuItem key={environment.value} value={environment.value}>
                        {environment.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </PanelSection>

            <PanelSection title="Animation">
              <Button fullWidth variant="outlined" startIcon={<Replay />} onClick={onReplayAnimation}>
                Replay entrance animation
              </Button>
            </PanelSection>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
