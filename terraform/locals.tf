# Derived values used in multiple places.

locals {
  # Canonical frontend URL. Vercel's stable production alias is
  # `<project-name>.vercel.app`, so deriving from the configured project
  # name keeps this known at plan time and avoids the chicken-and-egg of
  # the (non-existent) `vercel_project.url` attribute. Custom domains
  # land in `cors_origins` below alongside this.
  vercel_prod_url = "https://${vercel_project.frontend.name}.vercel.app"

  # CORS allowlist for the FastAPI app. The frontend proxies `/api/*`
  # server-side via Next.js rewrites, so the browser never actually hits
  # Fly cross-origin — this list is a safety net for direct hits and
  # staging sanity checks.
  cors_origins = compact([
    local.vercel_prod_url,
    var.custom_domain != "" ? "https://${var.custom_domain}" : "",
  ])
}
