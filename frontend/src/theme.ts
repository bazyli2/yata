/**
 * MUI theme for the yata marketing site.
 *
 * Every value here is lifted from the landing design ("00 — First visit")
 * so components can stay declarative: no page should hard-code a hex, a
 * shadow or a radius that the theme already carries.
 */
import { createTheme } from "@mui/material/styles";

// Raw design tokens. Exported because a few one-off surfaces in the
// landing page (the app mockup chrome, the blue CTA band) need the exact
// values and reading them from the palette would be a stretch.
export const tokens = {
  blue: "#12409c",
  blueHover: "#0e3480",
  blueActive: "#0a2a68",
  blueTint: "#d9e2f5",
  onBlue: "#f0f5ff",
  ink: "#201e1d",
  inkStrong: "#444141",
  inkMuted: "#605d5d",
  inkSubtle: "#7d7979",
  ground: "#eae9e9",
  surface: "#f8f4f4",
  surfaceAlt: "#eae7e7",
  white: "#ffffff",
  border: "#bab6b6",
  rule: "#e2dfdf",
  dot: "#d7d3d3",
} as const;

// The design's three elevation steps, reused verbatim.
const shadowSm = "0 1px 2px rgba(45,43,43,0.14)";
const shadowMd = "0 1px 2px rgba(45,43,43,0.14), 0 3px 10px rgba(45,43,43,0.06)";
const shadowLg = "0 12px 32px rgba(45,43,43,0.16)";

export const shadows = { sm: shadowSm, md: shadowMd, lg: shadowLg } as const;

// Archivo is loaded in layout.tsx via next/font and exposed as a CSS
// variable, so the stack below resolves to the hosted font at runtime and
// to the system sans during the brief fallback window.
const fontFamily = "var(--font-archivo), system-ui, sans-serif";

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: tokens.blue,
      dark: tokens.blueActive,
      light: tokens.blueTint,
      contrastText: tokens.onBlue,
    },
    background: {
      default: tokens.ground,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.ink,
      secondary: tokens.inkMuted,
      disabled: tokens.inkSubtle,
    },
    divider: tokens.rule,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily,
    // The hero headline is 52px on the 1440px canvas; it scales down
    // rather than wrapping into four lines on a phone.
    h1: {
      fontSize: "clamp(2.25rem, 1.5rem + 2.6vw, 3.25rem)",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.05,
    },
    h2: {
      fontSize: "clamp(1.75rem, 1.2rem + 2vw, 2.5rem)",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.1,
    },
    h3: {
      fontSize: "1.875rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      lineHeight: 1.2,
    },
    h4: {
      fontSize: "1.0625rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    // Hero sub-copy.
    subtitle1: {
      fontSize: "1.125rem",
      lineHeight: 1.6,
      color: tokens.inkMuted,
    },
    // The section kickers ("How it works").
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: tokens.inkSubtle,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.55,
    },
    caption: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: "antialiased",
        },
        "::selection": {
          background: "rgba(18,64,156,0.24)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        // Pill buttons; the design keeps labels flush left in the wide
        // hero/CTA buttons, which is what textAlign handles here.
        root: {
          borderRadius: 999,
          textAlign: "left",
          paddingInline: 24,
        },
        sizeLarge: {
          fontSize: "1rem",
          padding: "14px 28px",
        },
        sizeMedium: {
          fontSize: "0.875rem",
          padding: "10px 20px",
        },
        outlined: {
          borderColor: tokens.border,
          color: tokens.inkStrong,
          "&:hover": {
            borderColor: tokens.border,
            backgroundColor: "rgba(32,30,29,0.05)",
          },
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            boxShadow: "0 1px 2px rgba(45,43,43,0.2)",
            "&:hover": { backgroundColor: tokens.blueHover, boxShadow: shadowSm },
            "&:active": { backgroundColor: tokens.blueActive },
          },
        },
      ],
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 999,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: "hover",
      },
    },
  },
});

export default theme;
