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
 */
import { z } from "zod";

const isServer = typeof window === "undefined";

const schema = z.object({
  BACKEND_ORIGIN: z.string().url(),
});

const parsed = isServer
  ? schema.safeParse({
      BACKEND_ORIGIN: process.env.BACKEND_ORIGIN,
    })
  : schema.partial().safeParse({});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables (see frontend/.env.local.example):\n${issues}`,
  );
}

export const env = parsed.data as { BACKEND_ORIGIN?: string };
