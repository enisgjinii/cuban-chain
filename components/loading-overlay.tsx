"use client";

import { useEffect, useState } from "react";
import { Backdrop, CircularProgress, Typography, Box } from "@mui/material";

interface LoadingOverlayProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export function LoadingOverlay({ isLoading, progress, message = "Loading your chain..." }: LoadingOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <Backdrop open={isLoading} sx={{ zIndex: 9999, flexDirection: "column", gap: 2, bgcolor: "rgba(0,0,0,0.75)" }}>
      <CircularProgress size={48} sx={{ color: "primary.main" }} />
      <Typography variant="body2" sx={{ color: "grey.300" }}>{message}</Typography>
      {progress !== undefined && (
        <Box sx={{ width: 200 }}>
          <Box sx={{ height: 4, bgcolor: "grey.800", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${progress}%`, bgcolor: "primary.main", borderRadius: 2, transition: "width 0.3s" }} />
          </Box>
          <Typography variant="caption" sx={{ color: "grey.500", mt: 0.5, display: "block", textAlign: "center" }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </Backdrop>
  );
}
