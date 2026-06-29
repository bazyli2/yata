/**
 * Singleton Auth0 client for the Next.js app (server-side).
 *
 * Import `auth0` wherever you need to check the session, get access
 * tokens, or protect routes. The client reads its configuration from
 * environment variables (AUTH0_DOMAIN, AUTH0_CLIENT_ID, etc.) which
 * are injected by Doppler at runtime.
 *
 * An `audience` is configured so that Auth0 issues JWT access tokens
 * (instead of opaque tokens) which the FastAPI backend can verify.
 */
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
  },
});
