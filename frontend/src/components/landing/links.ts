/**
 * Where the landing CTAs point.
 *
 * Auth0's Next.js SDK mounts these routes automatically (see proxy.ts);
 * `screen_hint=signup` opens Universal Login on the sign-up tab.
 */
export const SIGN_IN_HREF = "/auth/login";
export const SIGN_UP_HREF = "/auth/login?screen_hint=signup";

/** In-page anchors used by the header nav. */
export const HOW_IT_WORKS_HREF = "#how-it-works";
export const PRICING_HREF = "#pricing";

/**
 * The demo list has no route yet — the design shows the affordance, so the
 * markup keeps it as an inert placeholder rather than inventing a page.
 */
export const DEMO_HREF = "#";
