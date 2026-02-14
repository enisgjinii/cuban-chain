"use client";

import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#d4a017",
      light: "#ffd700",
      dark: "#b8860b",
    },
    secondary: {
      main: "#90caf9",
    },
    background: {
      default: "#0a0a0a",
      paper: "#141414",
    },
    text: {
      primary: "#f5f5f5",
      secondary: "#aaaaaa",
    },
    divider: "rgba(255,255,255,0.08)",
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h6: { fontWeight: 700, fontSize: "1.1rem" },
    subtitle2: { fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa" },
    body2: { fontSize: "0.82rem" },
    caption: { fontSize: "0.72rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, borderRadius: 10 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: "0.82rem", minHeight: 42 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: "3px 3px 0 0" } } },
    MuiDrawer: { styleOverrides: { paper: { borderLeft: "1px solid rgba(255,255,255,0.06)" } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: "0.75rem", borderRadius: 8 } } },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#b8860b",
      light: "#d4a017",
      dark: "#8B6914",
    },
    secondary: {
      main: "#1976d2",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#666666",
    },
    divider: "rgba(0,0,0,0.08)",
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h6: { fontWeight: 700, fontSize: "1.1rem" },
    subtitle2: { fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" },
    body2: { fontSize: "0.82rem" },
    caption: { fontSize: "0.72rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, borderRadius: 10 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: "0.82rem", minHeight: 42 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: "3px 3px 0 0" } } },
    MuiDrawer: { styleOverrides: { paper: { borderLeft: "1px solid rgba(0,0,0,0.06)" } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: "0.75rem", borderRadius: 8 } } },
  },
});
