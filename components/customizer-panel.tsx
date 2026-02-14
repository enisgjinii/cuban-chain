"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Delete,
  CameraAlt,
  Videocam,
  Stop,
  Share,
  Link as LinkIcon,
  Diamond,
  AutoAwesome,
  Star,
  Palette,
  Block,
  Edit,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import { useThemeMode } from "@/components/mui-theme-registry";

import { FavoritesPanel } from "@/components/favorites-panel";
import { StoneColorPicker } from "./stone-color-picker";
import { PriceCalculator } from "./price-calculator";
import type {
  ChainConfig,
  SurfaceId,
  Material,
  SurfaceType,
  SurfaceConfig,
} from "@/lib/chain-config-types";
import {
  updateLinkMaterial,
  updateSurface,
  createDefaultGemstoneColors,
  applyMaterialToAllLinks,
  setChainLength,
} from "@/lib/chain-helpers";
import {
  type ChainLinkType,
  LINK_TYPE_TO_URL,
  CHAIN_PRESETS,
} from "@/lib/chain-manager";

// ─── Types ─────────────────────────────────────────────
interface CustomizerPanelProps {
  chainConfig: ChainConfig;
  setChainConfig: (config: ChainConfig) => void;
  selectedSurface: SurfaceId;
  setSelectedSurface: (surface: SurfaceId) => void;
  onSaveConfiguration: () => void;
  onLoadConfiguration: (event: React.ChangeEvent<HTMLInputElement>) => void;
  meshes: string[];
  nodes: string[];
  onSelectMesh: (mesh: string | null) => void;
  onHoverMesh: (mesh: string | null) => void;
  chainSpacing?: number;
  setChainSpacing?: (value: number) => void;
  onUndo?: () => void;
  autoRotate?: boolean;
  setAutoRotate?: (value: boolean) => void;
  showDebug?: boolean;
  setShowDebug?: (value: boolean) => void;
  onCaptureImage?: () => void;
  onStartRecording?: () => void;
  isRecording?: boolean;
  modelUrls?: string[];
  setModelUrls?: (urls: string[]) => void;
  isMobile?: boolean;
  onChainLengthChange?: (length: number) => void;
  onReplayAnimation?: () => void;
  onLoadFavorite?: (config: ChainConfig, urls: string[]) => void;
  background?: string;
  setBackground?: (bg: string) => void;
}

// ─── Data ──────────────────────────────────────────────
const MATERIALS: { label: string; value: Material; color: string }[] = [
  { label: "Silver", value: "silver", color: "#c0c0c0" },
  { label: "Gold", value: "gold", color: "#ffd700" },
  { label: "Grey", value: "grey", color: "#808080" },
  { label: "Black", value: "black", color: "#1a1a1a" },
  { label: "White", value: "white", color: "#f5f5f5" },
];

const DIAMOND_TYPES: { label: string; value: SurfaceType; icon: React.ReactNode }[] = [
  { label: "Diamonds", value: "gemstones", icon: <Diamond sx={{ fontSize: 18 }} /> },
  { label: "Moissanites", value: "moissanites", icon: <AutoAwesome sx={{ fontSize: 18 }} /> },
  { label: "Enamel", value: "enamel", icon: <Palette sx={{ fontSize: 18 }} /> },
  { label: "Engraving", value: "engraving", icon: <Edit sx={{ fontSize: 18 }} /> },
  { label: "Empty", value: "empty", icon: <Block sx={{ fontSize: 18 }} /> },
];

const GEMSTONE_COLORS = [
  { label: "Colourless", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#ea580c" },
];

const ENAMEL_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "White", value: "#ffffff" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#ea580c" },
  { label: "Opal 1", value: "#b8b8ff" },
  { label: "Opal 2", value: "#ffb8d1" },
];

const ENGRAVING_PATTERNS = [
  { label: "Pattern 1", value: "pattern1" },
  { label: "Pattern 2", value: "pattern2" },
];

const AVAILABLE_LINK_TYPES: { type: ChainLinkType; label: string }[] = [
  { type: "part1", label: "Part 1" },
  { type: "part3", label: "Part 3" },
  { type: "part4", label: "Part 4" },
  { type: "part5", label: "Part 5" },
  { type: "part6", label: "Part 6" },
  { type: "part7", label: "Part 7" },
  { type: "enamel", label: "Enamel" },
  { type: "pattern1", label: "Pattern 1" },
  { type: "cuban-link", label: "Cuban Link" },
];

const ENVIRONMENTS = [
  { label: "City (Default)", value: "city" },
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

// Small sub-component for the theme toggle row
function ThemeToggleRow() {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {mode === "dark" ? <DarkMode sx={{ fontSize: 18, color: "primary.main" }} /> : <LightMode sx={{ fontSize: 18, color: "primary.main" }} />}
        <Typography variant="body2">{mode === "dark" ? "Dark Mode" : "Light Mode"}</Typography>
      </Box>
      <Switch size="small" checked={mode === "dark"} onChange={toggleTheme} />
    </Box>
  );
}

// ─── Component ─────────────────────────────────────────
export function CustomizerPanel({
  chainConfig,
  setChainConfig,
  selectedSurface,
  setSelectedSurface,
  onSaveConfiguration,
  onLoadConfiguration,
  onUndo,
  onCaptureImage,
  onStartRecording,
  isRecording = false,
  modelUrls = [],
  setModelUrls,
  onChainLengthChange,
  onReplayAnimation,
  onLoadFavorite,
  autoRotate,
  setAutoRotate,
  showDebug,
  setShowDebug,
  background = "city",
  setBackground,
}: CustomizerPanelProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
  const [applyInserts, setApplyInserts] = useState(false);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedLinkType, setSelectedLinkType] = useState<ChainLinkType>("part1");
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const linkCount = modelUrls.length;
  const currentLink = chainConfig.links[selectedLinkIndex];
  const currentSurfaceConfig = currentLink?.surfaces[selectedSurface];
  const isTopSurface = selectedSurface === "top1" || selectedSurface === "top2";

  useEffect(() => {
    if (selectedLinkIndex >= linkCount) setSelectedLinkIndex(Math.max(0, linkCount - 1));
  }, [linkCount, selectedLinkIndex]);

  // ─── Helpers ────────────────────────────────────────
  const getColorOptions = () => {
    if (!currentSurfaceConfig) return [];
    switch (currentSurfaceConfig.type) {
      case "gemstones": return [{ label: "Colourless", value: "#ffffff" }];
      case "moissanites": return GEMSTONE_COLORS;
      case "enamel": return ENAMEL_COLORS;
      case "engraving": return ENGRAVING_PATTERNS;
      default: return [];
    }
  };

  const getCurrentColorValue = () => {
    if (!currentSurfaceConfig) return "";
    switch (currentSurfaceConfig.type) {
      case "gemstones":
      case "moissanites": return currentSurfaceConfig.gemstoneColors?.stone1 || "#ffffff";
      case "enamel": return currentSurfaceConfig.enamelColor || "#ffffff";
      case "engraving": return currentSurfaceConfig.engravingDesign || "pattern1";
      default: return "";
    }
  };

  const handleMaterialChange = (material: Material) => {
    if (applyToAll) {
      setChainConfig(applyMaterialToAllLinks(chainConfig, material));
      window.dispatchEvent(new CustomEvent("applyMaterialToModel", { detail: { material, targetModel: "all", targetIndex: -1 } }));
    } else {
      setChainConfig(updateLinkMaterial(chainConfig, selectedLinkIndex, material));
      window.dispatchEvent(new CustomEvent("applyMaterialToModel", { detail: { material, targetModel: "specific", targetIndex: selectedLinkIndex } }));
    }
  };

  const handleDiamondTypeChange = (type: SurfaceType) => {
    if (!applyInserts) return;
    let newSurfaceConfig: SurfaceConfig = { type };
    if (type === "gemstones" || type === "moissanites") {
      newSurfaceConfig = { type, gemstoneColors: createDefaultGemstoneColors(selectedSurface) };
    } else if (type === "enamel") {
      newSurfaceConfig = { type, enamelColor: "#ffffff" };
    } else if (type === "engraving") {
      newSurfaceConfig = { type, engravingDesign: "pattern1" };
    }
    setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
  };

  const handleColorChange = (value: string) => {
    if (!currentSurfaceConfig || !applyInserts) return;
    let newSurfaceConfig: SurfaceConfig;
    if (currentSurfaceConfig.type === "gemstones" || currentSurfaceConfig.type === "moissanites") {
      const colors = { stone1: value, stone2: value, ...(isTopSurface && { stone3: value }) };
      newSurfaceConfig = { ...currentSurfaceConfig, gemstoneColors: colors };
    } else if (currentSurfaceConfig.type === "enamel") {
      newSurfaceConfig = { ...currentSurfaceConfig, enamelColor: value };
    } else if (currentSurfaceConfig.type === "engraving") {
      newSurfaceConfig = { ...currentSurfaceConfig, engravingDesign: value as "pattern1" | "pattern2" };
    } else return;
    setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newSurfaceConfig));
  };

  const handleAddLink = useCallback((linkType: ChainLinkType) => {
    const url = LINK_TYPE_TO_URL[linkType];
    if (!url || !setModelUrls) return;
    setModelUrls([...modelUrls, url]);
  }, [modelUrls, setModelUrls]);

  const handleRemoveLink = useCallback((index: number) => {
    if (!setModelUrls || modelUrls.length <= 1) return;
    setModelUrls(modelUrls.filter((_, i) => i !== index));
  }, [modelUrls, setModelUrls]);

  const handleLoadPreset = useCallback((presetName: string) => {
    const preset = CHAIN_PRESETS[presetName];
    if (!preset || !setModelUrls) return;
    setModelUrls(preset.map((type) => LINK_TYPE_TO_URL[type]));
    setSelectedPreset(presetName);
  }, [setModelUrls]);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "My Custom Cuban Chain", text: "Check out this Cuban chain I designed!", url: window.location.href }); }
      catch (err) { if ((err as Error).name !== "AbortError") console.error("Error sharing:", err); }
    } else {
      try { await navigator.clipboard.writeText(window.location.href); }
      catch (err) { console.error("Failed to copy:", err); }
    }
  };

  const showColorDropdown = applyInserts && currentSurfaceConfig?.type && currentSurfaceConfig.type !== "empty";

  // ─── Render ─────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Typography
          variant="h6"
          sx={{
            background: "linear-gradient(135deg, #d4a017, #ffd700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 0.5,
          }}
        >
          Customize
        </Typography>
        <PriceCalculator chainConfig={chainConfig} chainLength={linkCount} />
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 42, px: 1 }}
      >
        <Tab label="Design" />
        <Tab label="Assembly" />
        <Tab label="Saved" />
        <Tab label="Settings" />
      </Tabs>

      {/* Scrollable Content */}
      <Box className="custom-scrollbar" sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
        {/* ═══════ DESIGN TAB ═══════ */}
        {tabIndex === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Link selection */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2">Selected Link</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "action.hover", borderRadius: 2, px: 0.5 }}>
                  <IconButton size="small" onClick={() => selectedLinkIndex > 0 && setSelectedLinkIndex(selectedLinkIndex - 1)} disabled={selectedLinkIndex <= 0}>
                    <ChevronLeft sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 48, textAlign: "center" }}>
                    {selectedLinkIndex + 1} / {linkCount}
                  </Typography>
                  <IconButton size="small" onClick={() => selectedLinkIndex < linkCount - 1 && setSelectedLinkIndex(selectedLinkIndex + 1)} disabled={selectedLinkIndex >= linkCount - 1}>
                    <ChevronRight sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>
              <FormControlLabel
                control={<Checkbox size="small" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />}
                label={<Typography variant="caption">Apply changes to all links</Typography>}
              />
            </Box>

            <Divider />

            {/* Material */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Base Material</Typography>
              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
                {MATERIALS.map((m) => (
                  <Box
                    key={m.value}
                    onClick={() => handleMaterialChange(m.value)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: m.color,
                      border: currentLink?.material === m.value ? "3px solid #d4a017" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: currentLink?.material === m.value ? "0 0 0 2px rgba(212,160,23,0.3)" : "none",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                    title={m.label}
                  />
                ))}
              </Box>
              <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 1, color: "text.secondary" }}>
                {MATERIALS.find((m) => m.value === currentLink?.material)?.label || "Select Material"}
              </Typography>
            </Box>

            <Divider />

            {/* Surface Design */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle2">Surface Design</Typography>
                <FormControlLabel
                  control={<Switch size="small" checked={applyInserts} onChange={(e) => setApplyInserts(e.target.checked)} />}
                  label={<Typography variant="caption">Enable</Typography>}
                  sx={{ mr: 0 }}
                />
              </Box>

              {applyInserts && (
                <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Diamond type grid */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                    {DIAMOND_TYPES.map((type) => {
                      const isSelected = currentSurfaceConfig?.type === type.value;
                      return (
                        <Box
                          key={type.value}
                          onClick={() => handleDiamondTypeChange(type.value)}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5,
                            p: 1.5,
                            borderRadius: 2,
                            border: "2px solid",
                            borderColor: isSelected ? "primary.main" : "divider",
                            bgcolor: isSelected ? "rgba(212,160,23,0.08)" : "transparent",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            "&:hover": { borderColor: isSelected ? "primary.main" : "text.secondary" },
                          }}
                        >
                          <Box sx={{ color: isSelected ? "primary.main" : "text.secondary" }}>{type.icon}</Box>
                          <Typography variant="caption" sx={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? "primary.main" : "text.secondary", fontSize: "0.65rem" }}>
                            {type.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Color swatches */}
                  {showColorDropdown && (
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
                        {currentSurfaceConfig?.type === "engraving" ? "Pattern" : "Color"}
                      </Typography>
                      {(currentSurfaceConfig?.type === "gemstones" || currentSurfaceConfig?.type === "moissanites" || currentSurfaceConfig?.type === "enamel") ? (
                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                          {getColorOptions().map((option) => (
                            <Box
                              key={option.value}
                              className={`swatch-btn ${getCurrentColorValue() === option.value ? "active" : ""}`}
                              onClick={() => handleColorChange(option.value)}
                              sx={{ bgcolor: option.value, border: option.value === "#ffffff" ? "2px solid #333" : undefined }}
                              title={option.label}
                            />
                          ))}
                        </Box>
                      ) : (
                        <FormControl fullWidth size="small">
                          <Select value={getCurrentColorValue()} onChange={(e) => handleColorChange(e.target.value)}>
                            {getColorOptions().map((option) => (
                              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  )}

                  {/* Individual stone colors */}
                  {(currentSurfaceConfig?.type === "gemstones" || currentSurfaceConfig?.type === "moissanites") && (
                    <StoneColorPicker
                      surfaceId={selectedSurface}
                      gemstoneColors={currentSurfaceConfig.gemstoneColors || { stone1: "#ffffff", stone2: "#ffffff" }}
                      onChange={(newColors) => {
                        const newConfig = { ...currentSurfaceConfig, gemstoneColors: newColors };
                        setChainConfig(updateSurface(chainConfig, selectedLinkIndex, selectedSurface, newConfig));
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ═══════ ASSEMBLY TAB ═══════ */}
        {tabIndex === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle2">Chain Length</Typography>
                <Chip label={`${linkCount} links`} size="small" variant="outlined" />
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  disabled={linkCount <= 1}
                  onClick={() => onChainLengthChange?.(Math.max(1, linkCount - 1))}
                >
                  − Link
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => onChainLengthChange?.(linkCount + 1)}
                >
                  + Link
                </Button>
              </Box>
            </Box>

            {setModelUrls && (
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
                  Add Specific Link Type
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                  {AVAILABLE_LINK_TYPES.slice(0, 6).map((item) => (
                    <Button
                      key={item.type}
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddLink(item.type)}
                      sx={{
                        height: 64,
                        flexDirection: "column",
                        gap: 0.5,
                        fontSize: "0.7rem",
                        borderColor: "divider",
                        "&:hover": { borderColor: "primary.main", bgcolor: "rgba(212,160,23,0.05)" },
                      }}
                    >
                      <Add sx={{ fontSize: 16 }} />
                      {item.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Presets</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
                {Object.keys(CHAIN_PRESETS).map((preset) => (
                  <Button
                    key={preset}
                    variant={selectedPreset === preset ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleLoadPreset(preset)}
                    startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                    sx={{ fontSize: "0.7rem", justifyContent: "flex-start", textAlign: "left", borderColor: "divider" }}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* ═══════ SAVED TAB ═══════ */}
        {tabIndex === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ bgcolor: "rgba(212,160,23,0.08)", p: 1.5, borderRadius: 2, border: "1px solid rgba(212,160,23,0.2)" }}>
              <Typography variant="caption" sx={{ color: "primary.light" }}>
                Save your designs to load them later. Designs are saved in your browser.
              </Typography>
            </Box>
            <FavoritesPanel
              chainConfig={chainConfig}
              modelUrls={modelUrls}
              onLoadFavorite={(config, urls) => onLoadFavorite?.(config, urls)}
            />
            <Button variant="outlined" size="small" fullWidth onClick={onSaveConfiguration}>
              Save Configuration (JSON)
            </Button>
            <Button variant="outlined" size="small" fullWidth component="label">
              Load from JSON File
              <input type="file" accept=".json" onChange={onLoadConfiguration} hidden />
            </Button>
          </Box>
        )}

        {/* ═══════ SETTINGS TAB ═══════ */}
        {tabIndex === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Export & Share</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onCaptureImage}
                  sx={{ height: 64, flexDirection: "column", gap: 0.5, borderColor: "divider" }}
                >
                  <CameraAlt sx={{ fontSize: 20 }} />
                  <Typography variant="caption">Capture</Typography>
                </Button>
                <Button
                  variant={isRecording ? "contained" : "outlined"}
                  size="small"
                  color={isRecording ? "error" : "primary"}
                  onClick={onStartRecording}
                  sx={{ height: 64, flexDirection: "column", gap: 0.5, borderColor: "divider" }}
                >
                  {isRecording ? <Stop sx={{ fontSize: 20 }} /> : <Videocam sx={{ fontSize: 20 }} />}
                  <Typography variant="caption">{isRecording ? "Stop" : "Record"}</Typography>
                </Button>
              </Box>
              <Button variant="outlined" size="small" fullWidth startIcon={<Share />} onClick={handleShare} sx={{ mt: 1 }}>
                Share Design
              </Button>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>View Settings</Typography>
              <ThemeToggleRow />
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Auto Rotate</Typography>
                <Switch size="small" checked={!!autoRotate} onChange={(e) => setAutoRotate?.(e.target.checked)} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Show Debug Info</Typography>
                <Switch size="small" checked={!!showDebug} onChange={(e) => setShowDebug?.(e.target.checked)} />
              </Box>
              {onReplayAnimation && (
                <Button variant="outlined" size="small" fullWidth onClick={onReplayAnimation} sx={{ mt: 1 }}>
                  Replay Entrance Animation
                </Button>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Environment</Typography>
              <FormControl fullWidth size="small">
                <Select value={background} onChange={(e) => setBackground?.(e.target.value)}>
                  {ENVIRONMENTS.map((env) => (
                    <MenuItem key={env.value} value={env.value}>{env.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
