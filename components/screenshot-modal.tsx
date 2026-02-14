"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { Download, CameraAlt } from "@mui/icons-material";

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (options: ScreenshotOptions) => void;
}

export interface ScreenshotOptions {
  addWatermark: boolean;
  watermarkText: string;
  backgroundColor: string;
  resolution: "1x" | "2x" | "4x";
  format: "png" | "jpg";
}

const BACKGROUND_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Transparent", value: "transparent" },
  { label: "Gray", value: "#f3f4f6" },
  { label: "Gold", value: "#fef3c7" },
  { label: "Silver", value: "#e5e7eb" },
];

const RESOLUTIONS = [
  { label: "1x", value: "1x" as const },
  { label: "2x", value: "2x" as const },
  { label: "4x", value: "4x" as const },
];

export function ScreenshotModal({ isOpen, onClose, onCapture }: ScreenshotModalProps) {
  const [options, setOptions] = useState<ScreenshotOptions>({
    addWatermark: true,
    watermarkText: "Cuban Chain Customizer",
    backgroundColor: "#ffffff",
    resolution: "2x",
    format: "png",
  });

  const handleCapture = () => {
    onCapture(options);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CameraAlt sx={{ color: "primary.main" }} />
        Screenshot Options
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
        {/* Watermark */}
        <Box>
          <FormControlLabel
            control={<Checkbox size="small" checked={options.addWatermark} onChange={(e) => setOptions({ ...options, addWatermark: e.target.checked })} />}
            label={<Typography variant="body2">Add watermark</Typography>}
          />
          {options.addWatermark && (
            <TextField
              size="small"
              fullWidth
              value={options.watermarkText}
              onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
              placeholder="Watermark text..."
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Background Color */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>Background Color</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {BACKGROUND_COLORS.map((color) => (
              <Box
                key={color.value}
                onClick={() => setOptions({ ...options, backgroundColor: color.value })}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  border: options.backgroundColor === color.value ? "2px solid" : "2px solid",
                  borderColor: options.backgroundColor === color.value ? "primary.main" : "divider",
                  bgcolor: color.value === "transparent" ? undefined : color.value,
                  backgroundImage: color.value === "transparent"
                    ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                    : undefined,
                  backgroundSize: "8px 8px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                title={color.label}
              />
            ))}
          </Box>
        </Box>

        {/* Resolution */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>Resolution</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {RESOLUTIONS.map((res) => (
              <Button
                key={res.value}
                variant={options.resolution === res.value ? "contained" : "outlined"}
                size="small"
                fullWidth
                onClick={() => setOptions({ ...options, resolution: res.value })}
                sx={{ borderColor: "divider" }}
              >
                {res.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Format */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>Format</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={options.format === "png" ? "contained" : "outlined"}
              size="small"
              fullWidth
              onClick={() => setOptions({ ...options, format: "png" })}
              sx={{ borderColor: "divider" }}
            >
              PNG
            </Button>
            <Button
              variant={options.format === "jpg" ? "contained" : "outlined"}
              size="small"
              fullWidth
              onClick={() => setOptions({ ...options, format: "jpg" })}
              sx={{ borderColor: "divider" }}
            >
              JPG
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<Download />} onClick={handleCapture}>Capture</Button>
      </DialogActions>
    </Dialog>
  );
}
