import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import { tokens } from "@/theme";
import { Section } from "./section";

const FOOTER_LINKS = ["Privacy", "Terms", "Contact"];

export function LandingFooter() {
  return (
    <Section
      component="footer"
      sx={{ bgcolor: tokens.surface, py: 3.5, mt: "auto", fontSize: 13, color: tokens.inkSubtle }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        <Typography component="span" sx={{ fontSize: 13 }}>
          © 2026 yata
        </Typography>
        <Stack direction="row" sx={{ gap: 2.5 }}>
          {FOOTER_LINKS.map((label) => (
            <Link
              key={label}
              href="#"
              underline="none"
              sx={{
                fontSize: 13,
                color: tokens.inkMuted,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {label}
            </Link>
          ))}
        </Stack>
      </Stack>
    </Section>
  );
}
