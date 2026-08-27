import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";

import { tokens } from "@/theme";

const STEPS = [
  {
    title: "Type it the way you'd say it",
    body: "“Book the dentist Thursday 9am #errands” lands on Thursday, tagged, with no menus opened.",
  },
  {
    title: "Today stays today",
    body: "Anything dated later sits in Upcoming until its morning comes around.",
  },
  {
    title: "Tags instead of folders",
    body: "One task can be work and deep work at once. Filter when you need to, ignore them when you don't.",
  },
];

export function HowItWorks() {
  return (
    <Box component="section" id="how-it-works">
      <Typography variant="overline" component="h2" sx={{ display: "block", mb: 1.5 }}>
        How it works
      </Typography>

      {STEPS.map((step) => (
        <Stack
          key={step.title}
          direction="row"
          sx={{ gap: 2, py: 2.5, borderTop: `1px solid ${tokens.rule}` }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: "50%",
              bgcolor: tokens.blueTint,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Check size={19} strokeWidth={2.5} color={tokens.blue} />
          </Box>
          <Box>
            <Typography variant="h4" component="h3" sx={{ mb: "3px" }}>
              {step.title}
            </Typography>
            <Typography variant="body1" sx={{ color: tokens.inkMuted, maxWidth: "46ch" }}>
              {step.body}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Box>
  );
}
