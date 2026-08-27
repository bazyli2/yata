import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { tokens } from "@/theme";
import { AppPreview } from "./app-preview";
import { DEMO_HREF, SIGN_UP_HREF } from "./links";
import { Section } from "./section";

export function Hero() {
  return (
    <Section component="section" sx={{ py: { xs: 7, md: 11 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 5, md: 6 },
          alignItems: "center",
        }}
      >
        <Stack sx={{ gap: 2.5, alignItems: "flex-start" }}>
          <Box
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              px: 1.75,
              py: 0.75,
              borderRadius: "16px",
              bgcolor: tokens.blueTint,
              color: tokens.blueActive,
            }}
          >
            {"Free while it's small"}
          </Box>

          <Typography variant="h1" component="h1">
            A list that only holds today.
          </Typography>

          <Typography variant="subtitle1" sx={{ maxWidth: "44ch" }}>
            Write the task, give it a day if it needs one, check it off. Everything else waits its
            turn instead of shouting at you.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ alignItems: "flex-start", gap: 1.75, mt: 0.75 }}
          >
            <Button href={SIGN_UP_HREF} variant="contained" size="large">
              Start your first list
            </Button>
            <Button href={DEMO_HREF} variant="outlined" size="large">
              See a demo list
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ color: tokens.inkSubtle }}>
            No account needed to try it. Nothing to install.
          </Typography>
        </Stack>

        <AppPreview />
      </Box>
    </Section>
  );
}
