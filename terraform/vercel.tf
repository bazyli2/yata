# Vercel frontend project.
#
# The Git integration is what actually deploys: any push to `main` that
# touches `frontend/**` (or anything else) triggers a Vercel build. No
# GitHub Actions workflow is needed on the Vercel side.
#
# Env vars are *not* set here — Doppler owns them and pushes them into
# Vercel via the Doppler↔Vercel dashboard integration (see README.md >
# Bootstrap step 5b). Keeping env-var management in one place prevents
# drift between what Doppler thinks is in prod and what Vercel actually
# has.

resource "vercel_project" "frontend" {
  name      = var.vercel_project_name
  framework = "nextjs"

  # The Next.js app is in a subdirectory of the monorepo.
  root_directory = "frontend"

  # pnpm workspace root is the repo root, not `frontend/`. Running pnpm
  # install from the parent ensures workspace links resolve correctly and
  # uses the committed pnpm-lock.yaml.
  install_command = "cd .. && pnpm install --frozen-lockfile"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }
}

# Optional custom domain. Vercel's auto-assigned *.vercel.app URL is
# always available; the custom domain is additive.
resource "vercel_project_domain" "frontend" {
  count      = var.custom_domain != "" ? 1 : 0
  project_id = vercel_project.frontend.id
  domain     = var.custom_domain
}
