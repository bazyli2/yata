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

// In Next.js 16 the native fetch is not cached by default inside Server
// Components, so we don't need to override anything here. If you ever want
// to force no-store (or add auth headers), add a middleware via `api.use`.
//
// Example:
//   api.use({
//     onRequest: ({ request }) =>
//       new Request(request, { cache: "no-store" }),
//   });

// Re-export a few handy aliases derived from the generated schema so
// consumers don't have to keep writing `components["schemas"]["…"]`.
export type Item = components["schemas"]["ItemRead"];
export type ItemCreate = components["schemas"]["ItemCreate"];
export type HealthResponse =
  paths["/api/health"]["get"]["responses"][200]["content"]["application/json"];
