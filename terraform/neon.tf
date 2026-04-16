# Managed Postgres for prod.
#
# One Neon project, one branch (main), one database, one role. The
# `random_password` lets Terraform own the credential lifecycle: rotating
# the DB password is `terraform apply -replace=random_password.db`, which
# re-fans the new value out to Doppler (and therefore to Fly via
# `doppler run` and to Vercel via the sync integration).

resource "random_password" "db" {
  length = 32

  # URL-safe: avoid symbols that require percent-encoding in the
  # libpq/psycopg connection string. psycopg handles these fine but it
  # makes the raw DATABASE_URL easier to copy-paste for debugging.
  special = false
}

resource "neon_project" "yata" {
  name       = "yata"
  region_id  = var.neon_region
  pg_version = 17
}

# Neon creates a "main" branch automatically when the project is created.
# We manage it explicitly so we can set autoscale/suspend. If this ever
# fights the provider (it has in the past), flip to a `data "neon_branch"`
# lookup and drop the configuration drift.
resource "neon_branch" "main" {
  project_id = neon_project.yata.id
  name       = "main"

  # Scale-to-zero after 5 minutes idle. 0.25–1 CU matches the workload:
  # low steady-state traffic, occasional bursts during deploys.
  compute_provisioner      = "k8s-pod"
  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 1
  suspend_timeout_seconds  = 300
}

resource "neon_role" "app" {
  project_id = neon_project.yata.id
  branch_id  = neon_branch.main.id
  name       = "app"
  password   = random_password.db.result
}

resource "neon_database" "app" {
  project_id = neon_project.yata.id
  branch_id  = neon_branch.main.id
  name       = "app"
  owner_name = neon_role.app.name
}
