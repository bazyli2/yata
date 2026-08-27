import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";

import { tokens } from "@/theme";
import { HOW_IT_WORKS_HREF, PRICING_HREF, SIGN_IN_HREF, SIGN_UP_HREF } from "./links";
import { CANVAS_MAX_WIDTH } from "./section";

const NAV_LINKS = [
  { label: "How it works", href: HOW_IT_WORKS_HREF },
  { label: "Pricing", href: PRICING_HREF },
];

export function LandingHeader() {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: tokens.surface,
        color: "text.primary",
        boxShadow: "0 1px 2px rgba(45,43,43,0.12)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 64, md: 72 },
          // The header sits on a tighter 40px gutter than the 72px body
          // sections, exactly as drawn.
          px: { xs: 3, md: 5 },
          maxWidth: CANVAS_MAX_WIDTH,
          width: "100%",
          mx: "auto",
          gap: 3,
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mr: "auto" }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "11px",
              bgcolor: "primary.main",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Check size={18} strokeWidth={3} color={tokens.onBlue} />
          </Box>
          <Typography component="span" sx={{ fontWeight: 700, fontSize: 18 }}>
            yata
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              underline="none"
              sx={{
                display: { xs: "none", md: "inline-flex" },
                fontSize: 14,
                fontWeight: 600,
                color: tokens.inkStrong,
                px: 1.75,
                py: 1.125,
                borderRadius: "20px",
                "&:hover": { bgcolor: "rgba(32,30,29,0.06)" },
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={SIGN_IN_HREF}
            underline="none"
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: tokens.inkStrong,
              px: 1.75,
              py: 1.125,
              borderRadius: "20px",
              "&:hover": { bgcolor: "rgba(32,30,29,0.06)" },
            }}
          >
            Sign in
          </Link>
          <Button href={SIGN_UP_HREF} variant="contained" size="medium">
            Start free
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
