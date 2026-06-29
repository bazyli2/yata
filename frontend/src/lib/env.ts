/**
 * Validated, typed access to runtime env vars.
 *
 * Importing this module fails fast at startup if any required variable
 * is missing or malformed. Always import `env` from here instead of
 * reading `process.env` directly.
 *
 * `BACKEND_ORIGIN` is server-only (no `NEXT_PUBLIC_` prefix). The browser
 * talks to the Next.js server on relative `/api/...` paths; Next's
 * `rewrites()` in `next.config.ts` proxies those to FastAPI. Server
 * Components use `BACKEND_ORIGIN` directly because Node's `fetch` needs
 * an absolute URL.
 *
 * Auth0 variables are consumed by the `@auth0/nextjs-auth0` SDK
 * automatically from `process.env`. We validate them here for
 * fail-fast behaviour.
 */
import { z } from "zod";

const isServer = typeof window === "undefined";

const schema = z.object({
  BACKEND_ORIGIN: z.string().url(),
  // Auth0 (read automatically by @auth0/nextjs-auth0, validated here)
  AUTH0_SECRET: z.string().min(1),
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(1),
  AUTH0_AUDIENCE: z.string().min(1),
});

const parsed = isServer
  ? schema.safeParse({
      BACKEND_ORIGIN: process.env.BACKEND_ORIGIN,
      AUTH0_SECRET: process.env.AUTH0_SECRET,
      AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
      AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
      AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
      AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    })
  : schema.partial().safeParse({});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Invalid environment variables. Secrets are managed by Doppler — ` +
      `make sure you ran \`doppler login\` and \`doppler setup\`, and that ` +
      `the frontend is started via \`doppler run -- pnpm dev\` (or via ` +
      `\`devbox services up\` / \`devbox run fe\`, which wrap doppler run ` +
      `for you):\n${issues}`,
  );
}

export const env = parsed.data as {
  BACKEND_ORIGIN?: string;
  AUTH0_SECRET?: string;
  AUTH0_DOMAIN?: string;
  AUTH0_CLIENT_ID?: string;
  AUTH0_CLIENT_SECRET?: string;
  AUTH0_AUDIENCE?: string;
};
