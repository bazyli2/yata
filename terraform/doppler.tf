# Doppler: prod secrets.
#
# Doppler is the single source of truth for runtime secrets. The Doppler
# project `yata` already exists (created out-of-band during initial
# setup) and its `dev` config is what local devbox services read.
#
# The `yata/prd` and `yata/terraform` environments + configs are created
# manually in the Doppler dashboard as one-time bootstrap prerequisites
# (see README.md > Bootstrap step 3). The Doppler Terraform provider
# does not expose data sources for individual environments or configs, so
# we reference them by literal name. Terraform manages the *secrets
# inside* `prd`, but not the container itself.
#
# Data flow after apply:
#
#   Neon ───► doppler_secret.* (prd config)
#                   │
#                   └─► Vercel Production env via the Doppler↔Vercel
#                       integration configured in the Doppler dashboard
#                       (the Doppler Terraform provider does not expose
#                       a Vercel integration resource, so this lives
#                       outside Terraform — one-time UI setup per env)

# ----- Terraform secrets data source (pre-existing config) -----------------
#
# Infrastructure-only tokens (NEON_API_KEY, NEON_ORG_ID,
# VERCEL_API_TOKEN) live in the `yata/terraform` Doppler
# config, separate from runtime secrets in `prd`. This keeps Doppler as
# the single source of truth for all secrets.
#
# IMPORTANT: the `yata/terraform` environment and config are created
# manually in the Doppler dashboard as a one-time bootstrap prerequisite
# — Terraform only *reads* them via this data source. Managing them as
# Terraform resources would create a circular dependency: the providers
# need these API keys to configure themselves, but they can't configure
# until the resources that hold the keys are created. See README.md >
# Bootstrap for setup instructions.

data "doppler_secrets" "terraform" {
  project = "yata"
  config  = "terraform"
}

# ----- Secrets ------------------------------------------------------------

# Variable names mirror the `dev` config (documented in README.md under
# Secrets > Variables currently expected). Same names, different values:
# pydantic-settings + next.config.ts read them identically in both envs.

resource "doppler_secret" "db_host" {
  project = "yata"
  config  = "prd"
  name    = "DB_HOST"
  value   = neon_endpoint.main.host
}

resource "doppler_secret" "db_port" {
  project = "yata"
  config  = "prd"
  name    = "DB_PORT"
  value   = "5432"
}

resource "doppler_secret" "db_user" {
  project = "yata"
  config  = "prd"
  name    = "DB_USER"
  value   = neon_role.app.name
}

resource "doppler_secret" "db_password" {
  project = "yata"
  config  = "prd"
  name    = "DB_PASSWORD"
  value   = neon_role.app.password
}

resource "doppler_secret" "db_name" {
  project = "yata"
  config  = "prd"
  name    = "DB_NAME"
  value   = neon_database.app.name
}

# Neon terminates TLS and rejects plaintext, so an explicit sslmode keeps
# the psycopg connection string honest. See backend/app/config.py for
# where this gets spliced into the URL.
resource "doppler_secret" "db_sslmode" {
  project = "yata"
  config  = "prd"
  name    = "DB_SSLMODE"
  value   = "require"
}

# JSON array. CORS_ORIGINS is fully resolved at plan time now that
# `local.vercel_prod_url` derives from the Vercel project name — no more
# empty-on-first-apply caveat. The frontend still proxies /api/*
# server-side so the browser never triggers CORS in the happy path; this
# list is the safety net for direct hits and staging.
# Consumed by frontend/next.config.ts to proxy /api/* to the Fly backend.
resource "doppler_secret" "backend_origin" {
  project = "yata"
  config  = "prd"
  name    = "BACKEND_ORIGIN"
  value   = "https://yata-backend-prd.fly.dev"
}

resource "doppler_secret" "cors_origins" {
  project = "yata"
  config  = "prd"
  name    = "CORS_ORIGINS"
  value   = jsonencode(local.cors_origins)
}


