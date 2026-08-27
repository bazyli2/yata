"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { theme } from "@/theme";

/**
 * Client-side MUI provider.
 *
 * `createTheme()` produces a non-serializable object, so the theme can only
 * be handed to React from a client component. Everything below it (the
 * landing page and its sections) can still be a server component: MUI ships
 * "use client" on its own component files.
 */
export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
