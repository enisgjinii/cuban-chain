"use client";

import type React from "react";
import { useCallback, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import type {
  ChainConfig,
  Material,
  SurfaceId,
} from "@/lib/chain-config-types";
import {
  applyMaterialToAllLinks,
  updateLinkMaterial,
} from "@/lib/chain-helpers";
import { URL_TO_LINK_TYPE } from "@/lib/chain-manager";

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
  selectedLinkIndex,
  setSelectedLinkIndex,
  modelUrls,
}: CustomizerPanelProps) {
  const [applyToAll, setApplyToAll] = useState(false);

  const linkCount = modelUrls.length;
  const currentLink = chainConfig.links[selectedLinkIndex];
  const selectedLinkType = URL_TO_LINK_TYPE[modelUrls[selectedLinkIndex]] ?? "cuban-main";

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box sx={{ px: 2.25, pt: 2.25, pb: 1.25 }}>
        <Typography variant="overline" sx={{ letterSpacing: "0.16em", color: "text.secondary" }}>
          Customize
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Cuban chain sidebar
        </Typography>
      </Box>

      <Box className="custom-scrollbar" sx={{ flex: 1, overflowY: "auto", px: 2.25, py: 2 }}>
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
        </Stack>

      </Box>
    </Box>
  );
}
