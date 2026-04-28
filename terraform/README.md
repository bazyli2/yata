# Terraform — yata production stack

This directory defines the production stack for yata:

- **Neon** — managed Postgres (project, main branch, autoscaling
  read/write endpoint, `app` database + role)
- **Fly.io** — FastAPI container (app + machine + IPs); secrets are
  written by Doppler's native Fly sync, not by Terraform
- **Vercel** — Next.js frontend (project linked to GitHub, production = `main`)
- **Doppler** — `prd` config holding all runtime secrets, synced to Fly
  via `doppler_secrets_sync_flyio` and to Vercel via the dashboard
  integration (the Doppler Terraform provider has no Vercel resource)

State lives in [Terraform Cloud](https://app.terraform.io/) under
`yata/yata-prod`. VCS integration runs `plan` on PRs that touch
`terraform/**` and `apply` on merge to `main`.

## Layout

```
terraform/
├── versions.tf     # terraform core pin, provider pins, cloud {} backend
├── providers.tf    # provider configs (tokens from TFC env vars)
├── variables.tf    # github_repo, fly_app_name, regions, custom_domain…
├── locals.tf       # derived names, CORS origins
├── neon.tf         # project, branch, endpoint, database, role, password
├── fly.tf          # app, v4+v6 IPs, machine (placeholder image)
├── vercel.tf       # project linked to GitHub, optional custom domain
├── doppler.tf      # prd config, secrets, Fly integration + sync
└── outputs.tf      # non-sensitive URLs/IDs
```

## Bootstrap (one-time, manual)

1. **Create the TFC workspace.**
   - Org: `yata`
   - Workspace: `yata-prod`, VCS-driven
   - Working directory: `terraform/`
   - Auto-apply: enabled for `main`

2. **Mint provider tokens.**
   - Neon: <https://console.neon.tech/app/settings/api-keys>
   - Vercel: <https://vercel.com/account/tokens> (full account scope)
   - Fly: `flyctl tokens create org`
   - Doppler: service account in the `yata` project with admin access

3. **Add them to TFC as sensitive workspace env vars.** (Not Terraform
   variables — environment variables, so the providers pick them up
   automatically.)

   | Variable           | Provider that reads it |
   | ------------------ | ---------------------- |
   | `NEON_API_KEY`     | `kislerdm/neon`        |
   | `VERCEL_API_TOKEN` | `vercel/vercel`        |
   | `FLY_API_TOKEN`    | `fly-apps/fly`         |
   | `DOPPLER_TOKEN`    | `DopplerHQ/doppler`    |

4. **Queue the first run in the TFC UI.** Review the plan, confirm apply.
   This creates everything end-to-end: Neon project, Fly app (placeholder
   image), Vercel project, Doppler `prd` config + secrets, and the
   Doppler→Fly sync. The Doppler→Vercel integration is configured once
   in the Doppler dashboard (the Doppler Terraform provider doesn't ship
   a Vercel integration resource).

5. **Mint CI deploy tokens and add to GitHub Actions secrets.**
   - `DOPPLER_TOKEN_CI_DEPLOY` — a Doppler service token scoped to
     `yata/prd`, minted in the Doppler dashboard.
   - `FLY_API_TOKEN` — `flyctl tokens create deploy -a yata-backend-prd`

6. **Trigger the first real backend deploy.** Push any change under
   `backend/**` to `main` — `.github/workflows/deploy-backend.yml` runs
   `alembic upgrade head` against Neon, then `flyctl deploy` to replace
   the placeholder image.

7. **Trigger the first frontend deploy.** Push any change under
   `frontend/**` (or re-run in the Vercel dashboard) — Vercel's Git
   integration builds and deploys automatically.

8. **Cutover from the old app.** Once `https://yata-backend-prd.fly.dev`
   passes the verification checklist below, destroy the legacy app:

   ```sh
   flyctl apps destroy yata-g9hica
   ```

## Daily workflow

- **Infra change.** Edit any `terraform/*.tf`, open a PR. TFC posts the
  plan as a PR comment. Merge to apply.
- **Backend change.** Push to `main`; `deploy-backend.yml` runs the
  migration + deploy.
- **Frontend change.** Push to `main`; Vercel auto-deploys.
- **Secret change.** Edit in the Doppler dashboard. For the backend,
  Fly picks it up on next container start (roll with
  `flyctl machine restart -a yata-backend-prd`). For the frontend,
  Vercel re-syncs within ~30s; trigger a new build if it needs to land
  in client-rendered code paths.

## Rotation runbooks

### Rotate the database password

```sh
# In TFC or locally with the matching env vars:
terraform apply -replace=random_password.db
```

This generates a new password, updates the Neon role, overwrites the
`DB_PASSWORD` Doppler secret, and the Doppler→Vercel sync propagates it.
Fly containers pick it up on their next restart; trigger one with
`flyctl machine restart -a yata-backend-prd`.

### Rotate the Doppler→Fly integration credentials

The Doppler→Fly sync uses the `FLY_API_TOKEN` stored in the Doppler
`yata/terraform` config. To rotate:

1. `flyctl tokens create deploy -a yata-backend-prd` to mint a new token.
2. Update `FLY_API_TOKEN` in the `yata/terraform` Doppler config.
3. `terraform apply -replace=doppler_integration_flyio.prd` to re-create
   the integration with the new key. The dependent
   `doppler_secrets_sync_flyio.prd` will be recreated alongside it and
   `restart_machines = true` rolls the running machines.

### Rotate a provider API token

Rotate it in the provider dashboard, update the corresponding TFC
workspace env var. No Terraform run is needed unless you're
simultaneously applying other changes.

## Teardown

```sh
terraform destroy
flyctl apps destroy yata-backend-prd   # if TF can't remove it cleanly
```

Neon, Vercel, and Doppler resources are all Terraform-managed and clean
up on `destroy`. The Fly provider occasionally leaves stub IPs behind;
the `flyctl apps destroy` above is a backstop.

## Known quirks

- `neon_branch` managing the auto-created `main` branch has had provider
  bugs. Fallback is to switch to a `data "neon_branch"` lookup and drop
  the autoscale/suspend config drift.
- `fly_machine.image` is `ignore_changes`'d — CI pushes the real image
  via `flyctl deploy`, and Terraform must not revert it.
- First apply leaves `CORS_ORIGINS=[]` because the Vercel URL isn't
  known until Vercel has deployed once. Re-apply after the first
  frontend build to fill it in. This is safe because the frontend
  proxies `/api/*` server-side, so the browser never exercises CORS.
