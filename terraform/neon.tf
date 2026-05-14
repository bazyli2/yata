# Managed Postgres for prod.
#
# One Neon project, one branch (main), one read/write endpoint, one
# database, one role. Neon generates the role's password server-side
# and exposes it as a sensitive computed attribute on `neon_role`; we
# pipe that into Doppler from there. See the rotation runbook in
# README.md — rotation is a Neon-side operation followed by
# `terraform apply -refresh-only`.
#
# The kislerdm/neon provider splits compute settings out of `neon_branch`
# and onto `neon_endpoint`: autoscale limits, the suspend timeout, and
# the provisioner choice all live there. The branch resource itself only
# knows about identity (project, name, parentage, protection).
#
# `org_id` is required — Neon migrated to an org-only model in 2024.
# The value lives in the `yata/terraform` Doppler config alongside the
# API key.

resource "neon_project" "yata" {
  name       = "yata"
  region_id  = var.neon_region
  pg_version = 17
  org_id     = data.doppler_secrets.terraform.map.NEON_ORG_ID
}

# Neon creates a "main" branch automatically when the project is created.
# We manage it explicitly so the role/database resources below have a
# stable handle. If this ever fights the provider (it has in the past),
# flip to a `data "neon_branch"` lookup and drop the configuration drift.
resource "neon_branch" "main" {
  project_id = neon_project.yata.id
  name       = "main"
}

# Read/write compute endpoint for the main branch. Compute settings live
# here, not on the branch. Scale-to-zero after 5 minutes idle; 0.25–1 CU
# matches the workload (low steady-state, occasional bursts on deploy).
# `k8s-neonvm` is the autoscaling-capable provisioner — required for the
# autoscaling_limit_* fields to take effect.
resource "neon_endpoint" "main" {
  project_id               = neon_project.yata.id
  branch_id                = neon_branch.main.id
  type                     = "read_write"
  compute_provisioner      = "k8s-neonvm"
  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 1
  suspend_timeout_seconds  = 300
}

resource "neon_role" "app" {
  project_id = neon_project.yata.id
  branch_id  = neon_branch.main.id
  name       = "app"
}

resource "neon_database" "app" {
  project_id = neon_project.yata.id
  branch_id  = neon_branch.main.id
  name       = "app"
  owner_name = neon_role.app.name
}
