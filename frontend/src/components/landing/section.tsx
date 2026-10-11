import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";

/**
 * Horizontal rhythm for the landing page.
 *
 * The design is drawn on a 1440px canvas with 72px gutters; content is
 * capped at that inner width and centred so the page doesn't stretch on
 * ultrawide displays, and the gutters shrink on small screens.
 */
export const GUTTER_X = { xs: 3, sm: 5, md: 9 };
export const CONTENT_MAX_WIDTH = 1296;
/** Full width of the design canvas, used by the full-bleed header. */
export const CANVAS_MAX_WIDTH = 1440;

export function Section({ children, sx, ...props }: BoxProps) {
  return (
    <Box sx={{ px: GUTTER_X, ...sx }} {...props}>
      <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: "auto" }}>{children}</Box>
    </Box>
  );
}
