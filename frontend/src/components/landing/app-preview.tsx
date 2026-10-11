import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Check, Plus } from "lucide-react";

import { shadows, tokens } from "@/theme";

const ROW_SX = {
  display: "flex",
  gap: 1.5,
  px: 2.5,
  py: 1.75,
  borderTop: `1px solid ${tokens.surfaceAlt}`,
};

/** The empty checkbox on an open task. */
function OpenCheckbox() {
  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        flex: "none",
        mt: "2px",
        border: `2px solid ${tokens.inkSubtle}`,
        borderRadius: "3px",
      }}
    />
  );
}

/**
 * The product screenshot beside the hero copy.
 *
 * It's a static illustration of the app, not a working list, so the whole
 * block is hidden from assistive technology — the surrounding copy already
 * explains what the product does.
 */
export function AppPreview() {
  return (
    <Paper
      aria-hidden
      sx={{
        borderRadius: "16px",
        boxShadow: shadows.lg,
        overflow: "hidden",
        bgcolor: tokens.surface,
      }}
    >
      {/* Window chrome */}
      <Stack
        direction="row"
        sx={{ alignItems: "center", gap: 1, px: 2.25, py: 1.75, bgcolor: tokens.surfaceAlt }}
      >
        {[0, 1, 2].map((dot) => (
          <Box key={dot} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: tokens.dot }} />
        ))}
        <Typography component="span" sx={{ fontSize: 12, color: tokens.inkSubtle, ml: 1 }}>
          Today · Monday 17 August
        </Typography>
      </Stack>

      {/* Quick-add row */}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 1.75,
          bgcolor: tokens.white,
          borderBottom: `2px solid ${tokens.blue}`,
        }}
      >
        <Plus size={18} strokeWidth={2} color={tokens.blue} />
        <Typography component="span" sx={{ fontSize: 14, color: tokens.inkMuted }}>
          Draft Q3 recap #work tomorrow
        </Typography>
      </Stack>

      {/* Open task with a due date */}
      <Box sx={{ ...ROW_SX, alignItems: "flex-start" }}>
        <OpenCheckbox />
        <Stack sx={{ gap: 0.625 }}>
          <Typography component="span" sx={{ fontSize: 15 }}>
            Send the venue deposit
          </Typography>
          <Typography
            component="span"
            sx={{ fontSize: 12, fontWeight: 500, color: tokens.blueActive }}
          >
            Overdue · Fri
          </Typography>
        </Stack>
      </Box>

      {/* Open task with a tag */}
      <Box sx={{ ...ROW_SX, alignItems: "flex-start" }}>
        <OpenCheckbox />
        <Stack sx={{ gap: 0.625, alignItems: "flex-start" }}>
          <Typography component="span" sx={{ fontSize: 15 }}>
            Reply to Nina about the lease
          </Typography>
          <Box
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 500,
              px: 1.125,
              py: 0.25,
              borderRadius: "12px",
              bgcolor: tokens.surfaceAlt,
              color: tokens.inkMuted,
            }}
          >
            home
          </Box>
        </Stack>
      </Box>

      {/* Completed task */}
      <Box sx={{ ...ROW_SX, alignItems: "center", color: tokens.inkSubtle }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            flex: "none",
            borderRadius: "3px",
            bgcolor: "primary.main",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Check size={12} strokeWidth={3} color={tokens.onBlue} />
        </Box>
        <Typography component="span" sx={{ fontSize: 15, textDecoration: "line-through" }}>
          Water the plants
        </Typography>
      </Box>
    </Paper>
  );
}
