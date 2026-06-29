"use client";

import { ThemeProvider } from "styled-components";

// themeConfig is the Casper design system light theme
// Inline the minimal theme shape needed so we don't import cspr-design at module load
// (its bundle accesses window at top level and breaks SSR)
const casperLightTheme = {
  colors: {
    primary: "#7C3AED",
    background: "#FFFFFF",
  },
};

export function CsprDesignProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={casperLightTheme}>{children}</ThemeProvider>;
}
