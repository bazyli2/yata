# Fly.io backend app.
#
# Terraform only creates and shapes the app + its IPs + a single machine
# with a placeholder image. The real container image is pushed by the
# `deploy-backend.yml` GitHub Actions workflow via `flyctl deploy`. The
# `lifecycle { ignore_changes = [image, env] }` block on fly_machine is
# load-bearing: without it, every `terraform apply` would revert the
# machine back to the placeholder image and break prod.
#
# Why a new app rather than importing `yata-g9hica`:
# the existing app was created interactively by `flyctl launch`, carries
# a random suffix, and shouldn't be in Terraform without an `import`
# dance. Simpler to stand up `yata-backend-prd` cleanly and destroy the
# old one manually once verified (see README.md > Cutover).

resource "fly_app" "backend" {
  name = var.fly_app_name
}

# Shared IPv4 (free, one per Fly org) and dedicated IPv6. Public HTTPS
# needs at least one of these assigned to the app.
resource "fly_ip" "v4" {
  app  = fly_app.backend.name
  type = "v4"
}

resource "fly_ip" "v6" {
  app  = fly_app.backend.name
  type = "v6"
}

# DOPPLER_TOKEN is the only Fly secret. Everything else (DB_*, CORS_*,
# BACKEND_ORIGIN) is pulled at container start by `doppler run`.
resource "fly_secret" "doppler_token" {
  app   = fly_app.backend.name
  name  = "DOPPLER_TOKEN"
  value = doppler_service_token.fly.key
}

resource "fly_machine" "backend" {
  app    = fly_app.backend.name
  region = var.fly_region
  name   = "${var.fly_app_name}-m0"

  # Placeholder image; `flyctl deploy` replaces it on first CI run. The
  # lifecycle block below keeps Terraform from reverting that replacement.
  image = "flyio/hellofly:latest"

  cpu_type = "shared"
  cpus     = 1
  memorymb = 256

  services = [
    {
      ports = [
        {
          port     = 443
          handlers = ["tls", "http"]
        },
        {
          port     = 80
          handlers = ["http"]
        },
      ]
      protocol      = "tcp"
      internal_port = 8080
    },
  ]

  depends_on = [
    fly_ip.v4,
    fly_ip.v6,
    fly_secret.doppler_token,
  ]

  lifecycle {
    ignore_changes = [
      # Updated by `flyctl deploy` in CI on every backend change.
      image,
      # Fly may inject deploy-time env vars; `doppler run` in the CMD
      # supplies the app-level config, so Terraform should stay out of
      # runtime env drift.
      env,
    ]
  }
}
