"use client";

import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { darkTheme, lightTheme } from "@/lib/mui-theme";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function MuiThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  // Persist preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
    if (saved === "light" || saved === "dark") setMode(saved);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme-mode", next);
      return next;
    });
  }, []);

  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
