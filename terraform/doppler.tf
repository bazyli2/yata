# Doppler: prod config, secrets, and the Fly.io sync.
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
#                   ├─► Fly via doppler_integration_flyio + sync
#                   │   (Doppler writes DB_* / CORS_ORIGINS / BACKEND_ORIGIN
#                   │    directly into the Fly app as env vars and
#                   │    restarts the machines)
#                   │
#                   └─► Vercel Production env via the Doppler↔Vercel
#                       integration configured in the Doppler dashboard
#                       (the Doppler Terraform provider does not expose
#                       a Vercel integration resource, so this lives
#                       outside Terraform — one-time UI setup per env)

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

# ----- Terraform secrets data source (pre-existing config) -----------------
#
# Infrastructure-only tokens (NEON_API_KEY, VERCEL_API_TOKEN,
# FLY_API_TOKEN) live in the `yata/terraform` Doppler config, separate
# from runtime secrets in `prd`. This keeps Doppler as the single source
# of truth for all secrets.
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
  config  = doppler_config.prd.name
  name    = "DB_HOST"
  value   = neon_endpoint.main.host
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
  value   = neon_role.app.password
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

# JSON array. CORS_ORIGINS is fully resolved at plan time now that
# `local.vercel_prod_url` derives from the Vercel project name — no more
# empty-on-first-apply caveat. The frontend still proxies /api/*
# server-side so the browser never triggers CORS in the happy path; this
# list is the safety net for direct hits and staging.
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

# ----- Fly.io sync --------------------------------------------------------

# Doppler's first-party Fly.io integration. Pushes the prd config into
# the Fly app as plain env vars and restarts machines on change, so the
# backend container no longer needs to wrap itself in `doppler run --`.
# The Fly API token comes from the same `terraform` Doppler config that
# feeds the Fly Terraform provider above.
resource "doppler_integration_flyio" "prd" {
  name    = "fly-prd"
  api_key = data.doppler_secrets.terraform.map.FLY_API_TOKEN
}

resource "doppler_secrets_sync_flyio" "prd" {
  integration = doppler_integration_flyio.prd.id
  project     = "yata"
  config      = doppler_config.prd.name

  app_id           = fly_app.backend.name
  restart_machines = true

  # Leave secrets in place if this sync is destroyed. Otherwise a routine
  # `terraform destroy` (or recreate) would wipe DB_* off Fly and brick
  # the app between plans.
  delete_behavior = "leave_in_target"

  depends_on = [
    fly_app.backend,
    doppler_secret.db_host,
    doppler_secret.db_port,
    doppler_secret.db_user,
    doppler_secret.db_password,
    doppler_secret.db_name,
    doppler_secret.db_sslmode,
    doppler_secret.cors_origins,
    doppler_secret.backend_origin,
  ]
}
