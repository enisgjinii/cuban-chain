"use client";

import { createTheme, MantineProvider } from "@mantine/core";
import type React from "react";

const theme = createTheme({
  fontFamily: "Roboto, Arial, sans-serif",
  primaryColor: "dark",
  defaultRadius: "md",
  components: {
    Button: {
      defaultProps: {
        fw: 600,
      },
    },
  },
});

export function MantineThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
