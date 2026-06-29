/**
 * Next.js 16 proxy — intercepts requests at the network boundary.
 *
 * This replaces the older middleware.ts convention. The Auth0 SDK
 * handles /auth/* routes (login, callback, logout, profile, etc.)
 * and manages rolling sessions automatically.
 */
import { auth0 } from "./lib/auth0";

export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
