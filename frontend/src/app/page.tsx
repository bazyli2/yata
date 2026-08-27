import Box from "@mui/material/Box";

import { CtaBanner } from "@/components/landing/cta-banner";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { Section } from "@/components/landing/section";
import { SocialProof } from "@/components/landing/social-proof";

/**
 * Public landing page ("00 — First visit" in the design).
 *
 * Deliberately static: it reads no session, so it can be prerendered at
 * build time and served from the edge. The authenticated product lives at
 * /app behind the Auth0 CTAs.
 */
export default function LandingPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", flex: 1 }}>
      <LandingHeader />

      <Box component="main" sx={{ flex: 1 }}>
        <Hero />

        {/* "How it works" alongside the proof/pricing column. */}
        <Section component="section" sx={{ pt: 1, pb: { xs: 7, md: 11 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 5, md: 8 },
              alignItems: "start",
            }}
          >
            <HowItWorks />
            <SocialProof />
          </Box>
        </Section>

        <CtaBanner />
      </Box>

      <LandingFooter />
    </Box>
  );
}
