import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { tokens } from "@/theme";
import { DEMO_HREF, SIGN_UP_HREF } from "./links";
import { Section } from "./section";

export function CtaBanner() {
  return (
    <Section
      component="section"
      sx={{ bgcolor: "primary.main", color: tokens.onBlue, py: { xs: 7, md: 9 } }}
    >
      <Typography variant="h2" component="h2" sx={{ maxWidth: "24ch", mb: 2 }}>
        {"Start with one thing you'd rather stop remembering."}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { sm: "center" }, gap: 2 }}>
        <Button
          href={SIGN_UP_HREF}
          variant="contained"
          size="large"
          sx={{
            alignSelf: "flex-start",
            bgcolor: tokens.onBlue,
            color: tokens.blueActive,
            boxShadow: "none",
            "&:hover": { bgcolor: tokens.blueTint, boxShadow: "none" },
          }}
        >
          Start free
        </Button>
        <Box component="span" sx={{ fontSize: 15, opacity: 0.9 }}>
          or{" "}
          <Link href={DEMO_HREF} underline="always" sx={{ color: tokens.onBlue, fontWeight: 600 }}>
            try the demo list
          </Link>{" "}
          first
        </Box>
      </Stack>
    </Section>
  );
}
