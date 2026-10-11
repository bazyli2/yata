import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { shadows, tokens } from "@/theme";

const PLANS = [
  { price: "Free", suffix: null, body: "Up to 3 lists, unlimited tasks." },
  { price: "$4", suffix: "/mo", body: "Everything, plus shared lists." },
];

export function SocialProof() {
  return (
    <Stack sx={{ gap: 2 }}>
      <Paper sx={{ borderRadius: "12px", boxShadow: shadows.md, p: 3.5 }}>
        <Typography component="p" sx={{ fontSize: 19, lineHeight: 1.5, mb: 2 }}>
          {"\u201CI stopped keeping a second list in my notes app. That's the whole review.\u201D"}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
          {/* Placeholder avatar: the design ships a plain disc, no photo. */}
          <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: tokens.surfaceAlt }} />
          <Box>
            <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
              Priya Anand
            </Typography>
            <Typography component="div" sx={{ fontSize: 13, color: tokens.inkSubtle }}>
              Operations lead
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Box
        id="pricing"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {PLANS.map((plan) => (
          <Paper key={plan.price} sx={{ borderRadius: "12px", boxShadow: shadows.sm, p: 3 }}>
            <Typography variant="h3" component="div">
              {plan.price}
              {plan.suffix && (
                <Box
                  component="span"
                  sx={{ fontSize: 15, fontWeight: 500, color: tokens.inkSubtle }}
                >
                  {plan.suffix}
                </Box>
              )}
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.inkMuted, mt: 0.5 }}>
              {plan.body}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}
