/**
 * Typed API client backed by openapi-fetch and the schema generated from
 * the FastAPI backend (see ./api-types.ts).
 *
 * Day-to-day you use `api.GET("/api/items", …)`, `api.POST(...)`, etc.
 * All paths, query/path params, request bodies, and responses are
 * type-checked against the backend's OpenAPI schema.
 *
 * The schema is regenerated automatically by the `typegen` devbox service
 * whenever any file under `backend/app/**` changes. You can also run
 * `devbox run gen:types` manually.
 */

import createClient from "openapi-fetch";

import type { components, paths } from "./api-types";
import { env } from "./env";

// In the browser we use a relative baseUrl so requests hit the Next.js
// server on the same origin and are proxied to FastAPI via `rewrites()`
// in `next.config.ts`. On the server (Server Components, route handlers)
// Node's `fetch` requires an absolute URL, so we use BACKEND_ORIGIN.
export const api = createClient<paths>({
  baseUrl: typeof window === "undefined" ? env.BACKEND_ORIGIN : "",
});

/**
 * Create an authenticated API client for use in Server Components.
 *
 * This fetches the Auth0 access token from the session and attaches it
 * as a Bearer token on every request so the FastAPI backend can verify
 * the user.
 */
export async function getAuthenticatedApi() {
  // Dynamic import so this module can still be imported from client
  // components without pulling in server-only code at build time.
  const { auth0 } = await import("./auth0");

  const tokenResponse = await auth0.getAccessToken();
  const token = tokenResponse?.token;

  const authedApi = createClient<paths>({
    baseUrl: env.BACKEND_ORIGIN,
  });

  if (token) {
    authedApi.use({
      onRequest: ({ request }) => {
        request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    });
  }

  return authedApi;
}

// Re-export a few handy aliases derived from the generated schema so
// consumers don't have to keep writing `components["schemas"]["…"]`.
export type Item = components["schemas"]["ItemRead"];
export type ItemCreate = components["schemas"]["ItemCreate"];
export type HealthResponse =
  paths["/api/health"]["get"]["responses"][200]["content"]["application/json"];
