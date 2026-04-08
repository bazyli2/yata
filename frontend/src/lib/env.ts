/**
 * Validated, typed access to runtime env vars.
 *
 * Importing this module fails fast at startup if any required variable
 * is missing or malformed. Always import `env` from here instead of
 * reading `process.env` directly.
 */
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables (see frontend/.env.local.example):\n${issues}`,
  );
}

export const env = parsed.data;
