# Doppler: prod config, secrets, and integrations.
#
# Doppler is the single source of truth for runtime secrets. The Doppler
# project `yata` already exists (created out-of-band during initial
# setup) and its `dev` config is what local devbox services read. This
# file adds a sibling `prd` environment/config next to `dev`.
#
# Data flow after apply:
#
#   Neon ───► doppler_secret.* (prd config)
#                   │
#                   ├─► Fly via `DOPPLER_TOKEN` (doppler_service_token.fly)
#                   │   read at container start by `doppler run -- fastapi run`
#                   │
#                   └─► Vercel Production env via doppler_secrets_sync
#                       (available at build + runtime)

# ----- Environment + config -----------------------------------------------

resource "doppler_environment" "prd" {
  project = "yata"
  slug    = "prd"
  name    = "Production"
}

resource "doppler_config" "prd" {
  project     = "yata"
  environment = doppler_environment.prd.slug
  name        = "prd"
}

# ----- Secrets ------------------------------------------------------------

# Variable names mirror the `dev` config (documented in README.md under
# Secrets > Variables currently expected). Same names, different values:
# pydantic-settings + next.config.ts read them identically in both envs.

resource "doppler_secret" "db_host" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "DB_HOST"
  value   = neon_branch.main.endpoint
}

resource "doppler_secret" "db_port" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "DB_PORT"
  value   = "5432"
}

resource "doppler_secret" "db_user" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "DB_USER"
  value   = neon_role.app.name
}

resource "doppler_secret" "db_password" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "DB_PASSWORD"
  value   = random_password.db.result
}

resource "doppler_secret" "db_name" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "DB_NAME"
  value   = neon_database.app.name
}

# Neon terminates TLS and rejects plaintext, so an explicit sslmode keeps
# the psycopg connection string honest. See backend/app/config.py for
# where this gets spliced into the URL.
resource "doppler_secret" "db_sslmode" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "DB_SSLMODE"
  value   = "require"
}

# JSON array. On first apply `local.cors_origins` may be empty because
# Vercel hasn't deployed yet; that's fine — the frontend proxies /api/*
# server-side so the browser never triggers CORS. A follow-up apply
# after Vercel has a URL fills this in.
resource "doppler_secret" "cors_origins" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "CORS_ORIGINS"
  value   = jsonencode(local.cors_origins)
}

# Consumed by frontend/next.config.ts to target the Fly backend.
resource "doppler_secret" "backend_origin" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "BACKEND_ORIGIN"
  value   = local.backend_origin
}

# ----- Service token for Fly ---------------------------------------------

# Read-only token scoped to yata/prd. Fed into `fly_secret.doppler_token`
# (see fly.tf). The container's CMD uses this to `doppler run --` and
# inject DB_* / CORS_ORIGINS at process start.
resource "doppler_service_token" "fly" {
  project = "yata"
  config  = doppler_config.prd.name
  name    = "fly-backend"
  access  = "read"
}

# ----- Vercel sync integration -------------------------------------------

# One-way push: Doppler (prd) → Vercel (Production environment).
# Overwrites anything set directly in the Vercel dashboard — keeps
# Doppler as the sole source of truth per the design notes.
resource "doppler_integration" "vercel" {
  name = "vercel-prd"
  type = "vercel"
}

resource "doppler_secrets_sync" "vercel_prd" {
  project     = "yata"
  config      = doppler_config.prd.name
  integration = doppler_integration.vercel.id

  data = {
    project     = vercel_project.frontend.id
    environment = "production"
  }

  # Vercel project must exist before the sync can target it.
  depends_on = [
    vercel_project.frontend,
    doppler_secret.backend_origin,
    doppler_secret.cors_origins,
  ]
}
