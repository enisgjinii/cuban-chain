import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./globals.css";

import MuiThemeRegistry from "@/components/mui-theme-registry";

export const metadata: Metadata = {
  title: "Cuban Link Customizer",
  description: "Customize your own Cuban link jewelry",
  generator: "Cuban Chain Customizer",
  icons: {
    icon: [
      { url: "/placeholder-logo.png", type: "image/png", sizes: "32x32" },
      { url: "/placeholder-logo.png", type: "image/png", sizes: "16x16" },
      { url: "/placeholder-logo.svg", type: "image/svg+xml" },
    ],
    apple: "/placeholder-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <MuiThemeRegistry>
          {children}
        </MuiThemeRegistry>
        <Analytics />
      </body>
    </html>
  );
}
