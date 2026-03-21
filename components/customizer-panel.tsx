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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type {
  ChainConfig,
  GemstoneColors,
  Material,
  SurfaceConfig,
  SurfaceId,
} from "@/lib/chain-config-types";
import { URL_TO_LINK_TYPE } from "@/lib/chain-manager";

type InsertType = "diamonds" | "moissanite";
type EngravingPattern = "pattern1" | "pattern2";

type ConfiguratorDraft = {
  material: Material;
  enableInserts: boolean;
  insertType: InsertType | "";
  insertColor: string;
  enableEngraving: boolean;
  engravingPattern: EngravingPattern;
  selectedSurface: SurfaceId;
  applyToSides: boolean;
  applyToAllLinks: boolean;
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
}

const MATERIAL_OPTIONS: Array<{ label: string; value: Material }> = [
  { label: "Silver", value: "silver" },
  { label: "Gold", value: "gold" },
  { label: "Grey", value: "grey" },
  { label: "Black", value: "black" },
];

const INSERT_OPTIONS: Array<{ label: string; value: InsertType }> = [
  { label: "Diamonds", value: "diamonds" },
  { label: "Moissanite", value: "moissanite" },
];

const DIAMOND_COLORS = [{ label: "Colourless", value: "#ffffff" }];

const MOISSANITE_COLORS = [
  { label: "Black", value: "#000000" },
  { label: "Green", value: "#16a34a" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#ea580c" },
  { label: "Rainbow1", value: "#ff4d6d" },
  { label: "Rainbow2", value: "#7c3aed" },
];

const SURFACE_OPTIONS: Array<{ label: string; value: SurfaceId }> = [
  { label: "Top 1", value: "top1" },
  { label: "Top 2", value: "top2" },
  { label: "Side 1", value: "side1" },
  { label: "Side 2", value: "side2" },
];

const ENGRAVING_OPTIONS: Array<{ label: string; value: EngravingPattern }> = [
  { label: "Pattern 1", value: "pattern1" },
  { label: "Pattern 2", value: "pattern2" },
];

function createGemstoneColors(surfaceId: SurfaceId, color: string): GemstoneColors {
  if (surfaceId === "top1" || surfaceId === "top2") {
    return { stone1: color, stone2: color, stone3: color };
  }
  return { stone1: color, stone2: color };
}

function deriveDraft(linkMaterial: Material, selectedSurface: SurfaceId, surfaceConfig?: SurfaceConfig): ConfiguratorDraft {
  const isGemstone = surfaceConfig?.type === "gemstones";
  const isMoissanite = surfaceConfig?.type === "moissanites";
  const isEngraving = surfaceConfig?.type === "engraving";

  const inferredInsertType: InsertType | "" = isGemstone
    ? "diamonds"
    : isMoissanite
      ? "moissanite"
      : "";

  return {
    material: linkMaterial,
    enableInserts: Boolean(isGemstone || isMoissanite),
    insertType: inferredInsertType,
    insertColor: surfaceConfig?.gemstoneColors?.stone1 ?? "",
    enableEngraving: Boolean(isEngraving),
    engravingPattern: surfaceConfig?.engravingDesign ?? "pattern1",
    selectedSurface,
    applyToSides: false,
    applyToAllLinks: false,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 0,
        p: 1.5,
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25, letterSpacing: 0.2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
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
      applyToSides: previous.applyToSides,
      applyToAllLinks: previous.applyToAllLinks,
    }));
  }, [selectedLink, selectedLinkIndex, selectedSurface]);

  useEffect(() => {
    if (!draft.enableInserts) {
      setDraft((previous) => ({ ...previous, insertType: "", insertColor: "" }));
      return;
    }

    if (!draft.insertType) {
      return;
    }

    if (draft.insertType === "diamonds") {
      if (draft.insertColor !== "#ffffff") {
        setDraft((previous) => ({ ...previous, insertColor: "#ffffff" }));
      }
      return;
    }

    const isValidMoissaniteColor = MOISSANITE_COLORS.some((option) => option.value === draft.insertColor);
    if (!isValidMoissaniteColor) {
      setDraft((previous) => ({ ...previous, insertColor: MOISSANITE_COLORS[0].value }));
    }
  }, [draft.enableInserts, draft.insertType, draft.insertColor]);

  useEffect(() => {
    if (draft.enableEngraving && draft.enableInserts) {
      setDraft((previous) => ({
        ...previous,
        enableInserts: false,
        insertType: "",
        insertColor: "",
      }));
    }
  }, [draft.enableEngraving, draft.enableInserts]);

  const handleApply = useCallback(() => {
    if (!selectedLink) {
      return;
    }

    const targetSurfaces: SurfaceId[] = draft.applyToSides
      ? ["side1", "side2"]
      : [draft.selectedSurface];

    const buildSurfaceConfig = (surfaceId: SurfaceId): SurfaceConfig => {
      if (draft.enableInserts && draft.insertType && draft.insertColor) {
        return {
          type: draft.insertType === "diamonds" ? "gemstones" : "moissanites",
          gemstoneColors: createGemstoneColors(surfaceId, draft.insertColor),
        };
      }

      if (draft.enableEngraving) {
        return {
          type: "engraving",
          engravingDesign: draft.engravingPattern,
        };
      }

      return { type: "empty" };
    };

    const nextLinks = chainConfig.links.map((link, index) => {
      const shouldApplyToLink = draft.applyToAllLinks || index === selectedLinkIndex;
      if (!shouldApplyToLink) {
        return link;
      }

      const nextSurfaces = { ...link.surfaces };
      targetSurfaces.forEach((surfaceId) => {
        nextSurfaces[surfaceId] = buildSurfaceConfig(surfaceId);
      });

      return {
        ...link,
        material: draft.material,
        surfaces: nextSurfaces,
      };
    });

    setChainConfig({
      chainLength: chainConfig.chainLength,
      links: nextLinks,
    });
  }, [chainConfig, draft, selectedLink, selectedLinkIndex, setChainConfig]);

  const colorOptions = draft.insertType === "diamonds" ? DIAMOND_COLORS : MOISSANITE_COLORS;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
        "& .MuiButton-root": {
          borderRadius: 0,
          textTransform: "none",
          boxShadow: "none",
        },
        "& .MuiOutlinedInput-root": {
          borderRadius: 0,
        },
      }}
    >
      <Box sx={{ px: 2, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, mb: 0.5 }}>
          Configurator
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Cuban Chain
        </Typography>
      </Box>

      <Box className="custom-scrollbar" sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
        <Stack spacing={1.25}>
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
          </Section>

          <Section title="Material Selection">
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
                {MATERIAL_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Section>

          <Section title="Apply Inserts">
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draft.enableInserts}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      enableInserts: event.target.checked,
                    }))
                  }
                />
              }
              label="Enable Inserts"
            />

            <Collapse in={draft.enableInserts}>
              <Stack spacing={1} sx={{ mt: 0.5 }}>
                <FormControl fullWidth size="small" disabled={!draft.enableInserts}>
                  <InputLabel>Apply Inserts</InputLabel>
                  <Select
                    label="Apply Inserts"
                    value={draft.insertType}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        insertType: event.target.value as InsertType,
                      }))
                    }
                  >
                    {INSERT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" disabled={!draft.enableInserts || !draft.insertType}>
                  <InputLabel>Color</InputLabel>
                  <Select
                    label="Color"
                    value={draft.insertColor}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        insertColor: event.target.value,
                      }))
                    }
                  >
                    {colorOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Collapse>
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
                    }));
                  }}
                >
                  {surface.label}
                </Button>
              ))}
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draft.applyToSides}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      applyToSides: event.target.checked,
                    }))
                  }
                />
              }
              label="Apply to sides"
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
              label="Apply to all links"
            />
          </Section>

          <Section title="Engraving">
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draft.enableEngraving}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      enableEngraving: event.target.checked,
                    }))
                  }
                />
              }
              label="Enable Engraving"
            />

            <Collapse in={draft.enableEngraving}>
              <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                <InputLabel>Pattern</InputLabel>
                <Select
                  label="Pattern"
                  value={draft.engravingPattern}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      engravingPattern: event.target.value as EngravingPattern,
                    }))
                  }
                >
                  {ENGRAVING_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Collapse>
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

          <Divider sx={{ my: 0.25 }} />
        </Stack>
      </Box>
    </Box>
  );
}
