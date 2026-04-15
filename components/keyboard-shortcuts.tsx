"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import { Keyboard, Close } from "@mui/icons-material";

interface KeyboardShortcutsProps {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onRotateToggle?: () => void;
  onReplayAnimation?: () => void;
  onViewPreset?: (preset: number) => void;
  onCaptureImage?: () => void;
  onToggleFullscreen?: () => void;
  onToggleHideUI?: () => void;
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
  { key: "H", label: "Hide UI", description: "Toggle UI visibility" },
  { key: "Esc", label: "Close", description: "Close dialogs/panels" },
];

export function KeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onRotateToggle,
  onReplayAnimation,
  onViewPreset,
  onCaptureImage,
  onToggleFullscreen,
  onToggleHideUI,
}: KeyboardShortcutsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Always hold the latest callbacks without re-registering the listener
  const cbRef = useRef({ onSave, onUndo, onRedo, onRotateToggle, onReplayAnimation, onViewPreset, onCaptureImage, onToggleFullscreen, onToggleHideUI });
  useEffect(() => {
    cbRef.current = { onSave, onUndo, onRedo, onRotateToggle, onReplayAnimation, onViewPreset, onCaptureImage, onToggleFullscreen, onToggleHideUI };
  });

  // Stable modal-open ref so the keydown handler can read it without re-registering
  const isModalOpenRef = useRef(false);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      // Open shortcuts dialog
      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        event.preventDefault();
        setIsModalOpen(true);
        return;
      }

      // Close shortcuts dialog
      if (event.key === "Escape") {
        if (isModalOpenRef.current) setIsModalOpen(false);
        return;
      }

      const cb = cbRef.current;

      // Ctrl/Cmd + S — Save
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        cb.onSave?.();
        return;
      }

      // Ctrl/Cmd + Z — Undo
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === "z") {
        event.preventDefault();
        cb.onUndo?.();
        return;
      }

      // Ctrl/Cmd + Y  or  Ctrl/Cmd + Shift + Z — Redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "z")
      ) {
        event.preventDefault();
        cb.onRedo?.();
        return;
      }

      // No more modifier-key shortcuts below this point
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      // R — Toggle auto-rotation
      if (event.key === "r" || event.key === "R") {
        cb.onRotateToggle?.();
        return;
      }

      // Space — Replay entrance animation
      if (event.key === " ") {
        event.preventDefault();
        cb.onReplayAnimation?.();
        return;
      }

      // P — Capture screenshot
      if (event.key === "p" || event.key === "P") {
        cb.onCaptureImage?.();
        return;
      }

      // F — Toggle fullscreen
      if (event.key === "f" || event.key === "F") {
        cb.onToggleFullscreen?.();
        return;
      }

      // H — Toggle UI visibility
      if (event.key === "h" || event.key === "H") {
        cb.onToggleHideUI?.();
        return;
      }

      // 1–5 — View presets
      const num = Number.parseInt(event.key, 10);
      if (num >= 1 && num <= 5) {
        cb.onViewPreset?.(num - 1);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // register once — reads latest values via refs

  return (
    <>
      {/* Floating trigger button */}
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
        PaperProps={{ sx: { borderRadius: "6px", bgcolor: "background.paper" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            py: 1.5,
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
                  px: 1,
                  py: 0.75,
                  borderRadius: "4px",
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
                    fontSize: "0.72rem",
                    fontFamily: "monospace",
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "3px",
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
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
            py: 1.25,
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
                borderRadius: "3px",
                fontSize: "0.7rem",
                fontFamily: "monospace",
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
