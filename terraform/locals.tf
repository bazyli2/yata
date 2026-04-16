# Derived values used in multiple places.

locals {
  # Canonical backend URL. Fly auto-assigns `<app>.fly.dev` on app create.
  backend_origin = "https://${fly_app.backend.name}.fly.dev"

  # Canonical frontend URL. Vercel exposes `.url` on the project resource
  # only after the first deployment, so on a fresh apply this may be an
  # empty string — CORS_ORIGINS tolerates that (see the doppler_secret
  # definition). Once Vercel has deployed once, re-applying fills it in.
  vercel_prod_url = try("https://${vercel_project.frontend.url}", "")

  # CORS allowlist for the FastAPI app. The frontend proxies `/api/*`
  # server-side via Next.js rewrites, so the browser never actually hits
  # Fly cross-origin — this list is a safety net for direct hits and
  # staging sanity checks.
  cors_origins = compact([
    local.vercel_prod_url,
    var.custom_domain != "" ? "https://${var.custom_domain}" : "",
  ])
}
