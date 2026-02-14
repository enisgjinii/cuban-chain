"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import { Keyboard, Close } from "@mui/icons-material";

interface KeyboardShortcutsProps {
  onSave?: () => void;
  onUndo?: () => void;
  onRotateToggle?: () => void;
  onReplayAnimation?: () => void;
  onViewPreset?: (preset: number) => void;
  onCaptureImage?: () => void;
}

const SHORTCUTS = [
  { key: "?", label: "Show shortcuts", description: "Open this help dialog" },
  { key: "Ctrl/⌘ + S", label: "Save", description: "Save configuration" },
  { key: "Ctrl/⌘ + Z", label: "Undo", description: "Undo last change" },
  { key: "Ctrl/⌘ + Y", label: "Redo", description: "Redo last change" },
  { key: "R", label: "Rotate", description: "Toggle auto-rotation" },
  { key: "Space", label: "Replay", description: "Replay entrance animation" },
  { key: "1–5", label: "View Presets", description: "Switch camera angle" },
  { key: "P", label: "Screenshot", description: "Capture screenshot" },
  { key: "F", label: "Fullscreen", description: "Toggle fullscreen mode" },
  { key: "G", label: "Grid", description: "Toggle grid overlay" },
  { key: "H", label: "Hide UI", description: "Toggle UI visibility" },
  { key: "Esc", label: "Close", description: "Close dialogs/panels" },
];

export function KeyboardShortcuts({
  onSave,
  onUndo,
  onRotateToggle,
  onReplayAnimation,
  onViewPreset,
  onCaptureImage,
}: KeyboardShortcutsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        event.preventDefault();
        setIsModalOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setIsModalOpen(false);
        return;
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Floating shortcut hint button */}
      <Tooltip title="Keyboard shortcuts (?)" arrow>
        <IconButton
          onClick={() => setIsModalOpen(true)}
          sx={{
            position: "fixed",
            bottom: 68,
            left: 16,
            zIndex: 40,
            width: 32,
            height: 32,
            bgcolor: (t) =>
              t.palette.mode === "dark" ? "rgba(20,20,20,0.8)" : "rgba(255,255,255,0.8)",
            backdropFilter: "blur(8px)",
            border: "1px solid",
            borderColor: "divider",
            "&:hover": { transform: "scale(1.1)", bgcolor: "action.hover" },
            transition: "transform 0.15s",
          }}
        >
          <Keyboard sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      {/* Shortcuts Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, bgcolor: "background.paper" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Keyboard sx={{ color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Keyboard Shortcuts
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsModalOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, maxHeight: 400, overflowY: "auto" }}>
            {SHORTCUTS.map((shortcut) => (
              <Box
                key={shortcut.key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1,
                  borderRadius: 1.5,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {shortcut.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {shortcut.description}
                  </Typography>
                </Box>
                <Box
                  component="kbd"
                  sx={{
                    px: 1,
                    py: 0.5,
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                  }}
                >
                  {shortcut.key}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: "center",
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "action.hover",
            py: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Press{" "}
            <Box
              component="kbd"
              sx={{
                px: 0.5,
                py: 0.25,
                bgcolor: "action.selected",
                borderRadius: 0.5,
                fontSize: "0.7rem",
              }}
            >
              Esc
            </Box>{" "}
            to close
          </Typography>
        </DialogActions>
      </Dialog>
    </>
  );
}
