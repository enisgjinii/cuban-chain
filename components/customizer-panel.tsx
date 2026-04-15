"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Remove,
  ContentCopy,
  ContentPaste,
  FileCopy,
  Delete,
  RestartAlt,
} from "@mui/icons-material";
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
  MATERIAL_OPTIONS as MATERIAL_LIBRARY,
} from "@/lib/chain-config-types";
import { MAX_CHAIN_LINKS } from "@/lib/chain-geometry";
import { URL_TO_LINK_TYPE, CHAIN_PRESETS } from "@/lib/chain-manager";
import { StoneColorPicker } from "@/components/stone-color-picker";

type EditableSurfaceType = Extract<SurfaceType, "empty" | "gemstones" | "enamel" | "engraving">;
type EngravingPattern = "pattern1" | "pattern2";

type ConfiguratorDraft = {
  material: Material;
  surfaceType: EditableSurfaceType;
  gemstoneColors: GemstoneColors;
  enamelColor: string;
  engravingPattern: EngravingPattern;
  selectedSurface: SurfaceId;
  applyToPair: boolean;
  applyToAllLinks: boolean;
  applyMaterialToAllLinks: boolean;
};

interface CustomizerPanelProps {
  chainConfig: ChainConfig;
  setChainConfig: (config: ChainConfig) => void;
  modelUrls: string[];
  selectedSurface: SurfaceId;
  setSelectedSurface: (surface: SurfaceId) => void;
  selectedLinkIndex: number;
  setSelectedLinkIndex: (index: number) => void;
  onSaveConfiguration?: () => void;
  onLoadConfiguration?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUndoAction?: () => void;
  onDone?: () => void;
  onChainLengthChange?: (length: number) => void;
  onDuplicateLink?: () => void;
  onRemoveLink?: () => void;
  onCopyLink?: () => void;
  onPasteLink?: () => void;
  onResetLink?: () => void;
  onLoadPreset?: (presetName: string) => void;
  clipboardLink?: import("@/lib/chain-config-types").LinkConfig | null;
  children?: React.ReactNode;
}

const SURFACE_OPTIONS: Array<{ label: string; value: SurfaceId }> = [
  { label: "Top 1", value: "top1" },
  { label: "Top 2", value: "top2" },
  { label: "Side 1", value: "side1" },
  { label: "Side 2", value: "side2" },
];

const SURFACE_TYPE_OPTIONS: Array<{ label: string; value: EditableSurfaceType }> = [
  { label: "Empty", value: "empty" },
  { label: "Gemstones", value: "gemstones" },
  { label: "Enamel", value: "enamel" },
  { label: "Engraving", value: "engraving" },
];

function isTopSurface(surfaceId: SurfaceId): boolean {
  return surfaceId === "top1" || surfaceId === "top2";
}

function createGemstoneColors(surfaceId: SurfaceId, color = "#ffffff"): GemstoneColors {
  if (surfaceId === "top1" || surfaceId === "top2") {
    return { stone1: color, stone2: color, stone3: color };
  }
  return { stone1: color, stone2: color };
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

function deriveDraft(linkMaterial: Material, selectedSurface: SurfaceId, surfaceConfig?: SurfaceConfig): ConfiguratorDraft {
  return {
    material: linkMaterial,
    surfaceType: normalizeSurfaceType(surfaceConfig?.type),
    gemstoneColors: normalizeGemstoneColors(selectedSurface, surfaceConfig?.gemstoneColors),
    enamelColor: surfaceConfig?.enamelColor ?? "#ffffff",
    engravingPattern: surfaceConfig?.engravingDesign ?? "pattern1",
    selectedSurface,
    applyToPair: false,
    applyToAllLinks: false,
    applyMaterialToAllLinks: false,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        py: 1.25,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.1, letterSpacing: 0.2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function CustomizerPanel({
  chainConfig,
  setChainConfig,
  modelUrls,
  selectedSurface,
  setSelectedSurface,
  selectedLinkIndex,
  setSelectedLinkIndex,
  onSaveConfiguration,
  onLoadConfiguration,
  onUndoAction,
  onDone,
  onChainLengthChange,
  onDuplicateLink,
  onRemoveLink,
  onCopyLink,
  onPasteLink,
  onResetLink,
  onLoadPreset,
  clipboardLink,
  children,
}: CustomizerPanelProps) {
  const selectedLink = chainConfig.links[selectedLinkIndex];
  const linkCount = chainConfig.links.length;
  const selectedLinkType = useMemo(
    () => URL_TO_LINK_TYPE[modelUrls[selectedLinkIndex]] ?? "cuban-main",
    [modelUrls, selectedLinkIndex]
  );

  const [draft, setDraft] = useState<ConfiguratorDraft>(() =>
    deriveDraft(selectedLink?.material ?? "silver", selectedSurface, selectedLink?.surfaces[selectedSurface])
  );

  useEffect(() => {
    if (!selectedLink) {
      return;
    }

    setDraft((previous) => ({
      ...deriveDraft(selectedLink.material, selectedSurface, selectedLink.surfaces[selectedSurface]),
      applyToPair: previous.applyToPair,
      applyToAllLinks: previous.applyToAllLinks,
      applyMaterialToAllLinks: previous.applyMaterialToAllLinks,
    }));
  }, [selectedLink, selectedLinkIndex, selectedSurface]);

  useEffect(() => {
    const normalizedColors = normalizeGemstoneColors(draft.selectedSurface, draft.gemstoneColors);
    if (JSON.stringify(normalizedColors) !== JSON.stringify(draft.gemstoneColors)) {
      setDraft((previous) => ({ ...previous, gemstoneColors: normalizedColors }));
    }
  }, [draft.gemstoneColors, draft.selectedSurface]);

  const handleApply = useCallback(() => {
    if (!selectedLink) {
      return;
    }

    const targetSurfaces: SurfaceId[] = draft.applyToPair
      ? isTopSurface(draft.selectedSurface)
        ? ["top1", "top2"]
        : ["side1", "side2"]
      : [draft.selectedSurface];

    const buildSurfaceConfig = (surfaceId: SurfaceId): SurfaceConfig => {
      switch (draft.surfaceType) {
        case "gemstones":
          return {
            type: "gemstones",
            gemstoneColors: normalizeGemstoneColors(surfaceId, draft.gemstoneColors),
          };
        case "enamel":
          return {
            type: "enamel",
            enamelColor: draft.enamelColor,
          };
        case "engraving":
          return {
            type: "engraving",
            engravingDesign: draft.engravingPattern,
          };
        case "empty":
        default:
          return { type: "empty" };
      }
    };

    const nextLinks = chainConfig.links.map((link, index) => {
      const shouldApplySurface = draft.applyToAllLinks || index === selectedLinkIndex;
      const shouldApplyMaterial = draft.applyMaterialToAllLinks || index === selectedLinkIndex;
      const nextSurfaces = { ...link.surfaces };

      if (shouldApplySurface) {
        targetSurfaces.forEach((surfaceId) => {
          nextSurfaces[surfaceId] = buildSurfaceConfig(surfaceId);
        });
      }

      return {
        ...link,
        material: shouldApplyMaterial ? draft.material : link.material,
        surfaces: nextSurfaces,
      };
    });

    setChainConfig({
      chainLength: chainConfig.chainLength,
      links: nextLinks,
    });
  }, [chainConfig, draft, selectedLink, selectedLinkIndex, setChainConfig]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bgcolor: "background.paper",
        "& .MuiButton-root": {
          borderRadius: 1.25,
          textTransform: "none",
          boxShadow: "none",
        },
        "& .MuiOutlinedInput-root": {
          borderRadius: 1.25,
        },
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
          borderBottomLeftRadius: 1.5,
          borderBottomRightRadius: 1.5,
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5 }}>
          Configurator
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Cuban Chain
        </Typography>
      </Box>

      <Box className="custom-scrollbar" sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
        <Stack spacing={0} divider={<Divider />}>
          <Section title="Chain Length">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Remove link">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onChainLengthChange?.(linkCount - 1)}
                    disabled={linkCount <= 1}
                  >
                    <Remove sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Slider
                value={linkCount}
                min={1}
                max={MAX_CHAIN_LINKS}
                step={1}
                onChange={(_, value) => onChainLengthChange?.(value as number)}
                valueLabelDisplay="auto"
                size="small"
                sx={{ flex: 1 }}
              />
              <Tooltip title="Add link">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onChainLengthChange?.(linkCount + 1)}
                    disabled={linkCount >= MAX_CHAIN_LINKS}
                  >
                    <Add sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 24, textAlign: "center" }}>
                {linkCount}
              </Typography>
            </Stack>
          </Section>

          <Section title="Selected Link">
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

            <Stack direction="row" spacing={0.5} sx={{ mt: 1, justifyContent: "center" }}>
              <Tooltip title="Duplicate link">
                <IconButton size="small" onClick={onDuplicateLink}>
                  <FileCopy sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove link">
                <span>
                  <IconButton size="small" onClick={onRemoveLink} disabled={linkCount <= 1}>
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Copy link config">
                <IconButton size="small" onClick={onCopyLink}>
                  <ContentCopy sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Paste link config">
                <span>
                  <IconButton size="small" onClick={onPasteLink} disabled={!clipboardLink}>
                    <ContentPaste sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reset link">
                <IconButton size="small" onClick={onResetLink}>
                  <RestartAlt sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Section>

          <Section title="Material Selection">
            <Stack spacing={1}>
              <FormControl fullWidth size="small">
                <InputLabel>Material</InputLabel>
                <Select
                  label="Material"
                  value={draft.material}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      material: event.target.value as Material,
                    }))
                  }
                >
                  {MATERIAL_LIBRARY.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            bgcolor: option.color,
                            border: "1px solid",
                            borderColor: option.value === "white" ? "divider" : "transparent",
                          }}
                        />
                        <span>{option.name}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={draft.applyMaterialToAllLinks}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        applyMaterialToAllLinks: event.target.checked,
                      }))
                    }
                  />
                }
                label="Apply material to all links"
              />
            </Stack>
          </Section>

          <Section title="Surface Controls">
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mb: 1 }}>
              {SURFACE_OPTIONS.map((surface) => (
                <Button
                  key={surface.value}
                  size="small"
                  variant={draft.selectedSurface === surface.value ? "contained" : "outlined"}
                  onClick={() => {
                    setSelectedSurface(surface.value);
                    setDraft((previous) => ({
                      ...previous,
                      selectedSurface: surface.value,
                      gemstoneColors: normalizeGemstoneColors(surface.value, previous.gemstoneColors),
                    }));
                  }}
                >
                  {surface.label}
                </Button>
              ))}
            </Stack>

            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 1 }}>
              Top surfaces use 3 gemstones. Side surfaces use 2 gemstones.
            </Typography>

            <Stack spacing={1}>
              <FormControl fullWidth size="small">
                <InputLabel>Customization</InputLabel>
                <Select
                  label="Customization"
                  value={draft.surfaceType}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      surfaceType: event.target.value as EditableSurfaceType,
                    }))
                  }
                >
                  {SURFACE_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Collapse in={draft.surfaceType === "gemstones"} unmountOnExit>
                <StoneColorPicker
                  surfaceId={draft.selectedSurface}
                  gemstoneColors={draft.gemstoneColors}
                  onChange={(gemstoneColors) =>
                    setDraft((previous) => ({
                      ...previous,
                      gemstoneColors: normalizeGemstoneColors(previous.selectedSurface, gemstoneColors),
                    }))
                  }
                />
              </Collapse>

              <Collapse in={draft.surfaceType === "enamel"} unmountOnExit>
                <Stack spacing={1} sx={{ pt: 0.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Enamel Color</InputLabel>
                    <Select
                      label="Enamel Color"
                      value={draft.enamelColor}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          enamelColor: event.target.value,
                        }))
                      }
                    >
                      {ENAMEL_COLORS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                bgcolor: option.value,
                                border: "1px solid",
                                borderColor: option.value === "#ffffff" ? "divider" : "transparent",
                              }}
                            />
                            <span>{option.name}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Stack direction="row" spacing={1}>
                    <Box
                      component="input"
                      type="color"
                      value={draft.enamelColor}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setDraft((previous) => ({ ...previous, enamelColor: event.target.value }))
                      }
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        background: "none",
                      }}
                    />
                    <Box
                      component="input"
                      type="text"
                      value={draft.enamelColor}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setDraft((previous) => ({ ...previous, enamelColor: event.target.value }))
                      }
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
                  </Stack>
                </Stack>
              </Collapse>

              <Collapse in={draft.surfaceType === "engraving"} unmountOnExit>
                <FormControl fullWidth size="small" sx={{ pt: 0.5 }}>
                  <InputLabel>Engraving Design</InputLabel>
                  <Select
                    label="Engraving Design"
                    value={draft.engravingPattern}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        engravingPattern: event.target.value as EngravingPattern,
                      }))
                    }
                  >
                    {ENGRAVING_DESIGNS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Collapse>

              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Empty keeps the base material visible with no added element.
              </Typography>
            </Stack>
          </Section>

          <Section title="Apply Scope">
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draft.applyToPair}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      applyToPair: event.target.checked,
                    }))
                  }
                />
              }
              label={isTopSurface(draft.selectedSurface) ? "Apply to both top surfaces" : "Apply to both side surfaces"}
            />

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draft.applyToAllLinks}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      applyToAllLinks: event.target.checked,
                    }))
                  }
                />
              }
              label="Apply this surface to all links"
            />
          </Section>

          <Section title="Actions">
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleApply} fullWidth>
                Apply
              </Button>
              <Button variant="outlined" onClick={onUndoAction} disabled={!onUndoAction} fullWidth>
                Undo
              </Button>
              <Button variant="outlined" color="inherit" onClick={onDone} disabled={!onDone} fullWidth>
                Done
              </Button>
            </Stack>
          </Section>

          <Section title="Presets">
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
              {Object.keys(CHAIN_PRESETS).map((presetName) => (
                <Button
                  key={presetName}
                  size="small"
                  variant="outlined"
                  onClick={() => onLoadPreset?.(presetName)}
                  sx={{ textTransform: "capitalize", fontSize: "0.72rem" }}
                >
                  {presetName.replaceAll("-", " ")}
                </Button>
              ))}
            </Stack>
          </Section>

          <Section title="Configuration">
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={onSaveConfiguration} disabled={!onSaveConfiguration} fullWidth>
                Save
              </Button>
              <Button variant="outlined" component="label" disabled={!onLoadConfiguration} fullWidth>
                Load
                <input type="file" accept=".json" hidden onChange={onLoadConfiguration} />
              </Button>
            </Stack>
          </Section>

          {children}

        </Stack>
      </Box>
    </Box>
  );
}
