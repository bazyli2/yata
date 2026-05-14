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
├── providers.tf    # provider configs (tokens from Doppler yata/terraform)
├── variables.tf    # github_repo, fly_app_name, regions, custom_domain…
├── locals.tf       # derived names, CORS origins
├── neon.tf         # project, branch, endpoint, database, role
├── fly.tf          # app, v4+v6 IPs, machine (placeholder image)
├── vercel.tf       # project linked to GitHub, optional custom domain
├── doppler.tf      # prd config + secrets + Fly sync; reads yata/terraform
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
   - Doppler: a personal token (free tier) or service-account token
     (paid tier) with access to the `yata` project

3. **Create the `yata/terraform` Doppler config (clickops prerequisite).**
   Terraform *reads* this config via a data source but does not *create*
   it (creating it in the same plan would cause a circular dependency
   — the providers need these keys to configure themselves). In the
   Doppler dashboard:

   1. Create environment **Terraform** (slug `terraform`) under project
      `yata`.
   2. Create config **terraform** under that environment.
   3. Add three secrets:

      | Secret             | Value source                             |
      | ------------------ | ---------------------------------------- |
      | `NEON_API_KEY`     | Neon API key from step 2                 |
      | `VERCEL_API_TOKEN` | Vercel access token from step 2          |
      | `FLY_API_TOKEN`    | Fly org token from step 2                |

4. **Add `DOPPLER_TOKEN` to TFC as a sensitive workspace env var.**
   This is the only TFC secret — everything else lives in Doppler.

   | Variable        | Purpose                                     |
   | --------------- | ------------------------------------------- |
   | `DOPPLER_TOKEN` | Authenticates the Doppler provider; must     |
   |                 | have access to `yata/terraform` (read) and  |
   |                 | `yata/prd` (read + write)                   |

5. **Queue the first run in the TFC UI.** Review the plan, confirm apply.
   This creates everything end-to-end: Neon project, Fly app (placeholder
   image), Vercel project, Doppler `prd` config + secrets, and the
   Doppler→Fly sync. The Doppler→Vercel integration is configured once
   in the Doppler dashboard (the Doppler Terraform provider doesn't ship
   a Vercel integration resource).

6. **Mint CI deploy tokens and add to GitHub Actions secrets.**
   - `DOPPLER_TOKEN_CI_DEPLOY` — a Doppler service token scoped to
     `yata/prd`, minted in the Doppler dashboard.
   - `FLY_API_TOKEN` — `flyctl tokens create deploy -a yata-backend-prd`

7. **Trigger the first real backend deploy.** Push any change under
   `backend/**` to `main` — `.github/workflows/deploy-backend.yml` runs
   `alembic upgrade head` against Neon, then `flyctl deploy` to replace
   the placeholder image.

8. **Trigger the first frontend deploy.** Push any change under
   `frontend/**` (or re-run in the Vercel dashboard) — Vercel's Git
   integration builds and deploys automatically.

9. **Cutover from the old app.** Once `https://yata-backend-prd.fly.dev`
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

Neon owns the password for `neon_role.app` — `password` on `neon_role`
is a server-generated, read-only attribute. To rotate:

1. Reset the password in the [Neon console](https://console.neon.tech/)
   (Branches → `main` → Roles → `app` → Reset password) or via the API:
   `POST /projects/{project_id}/branches/{branch_id}/roles/app/reset_password`.
2. Run `terraform apply -refresh-only` in TFC. Terraform pulls the new
   password into state via `neon_role.app.password`; `doppler_secret.db_password`
   plans an in-place update on the next regular apply.
3. The Doppler→Fly sync writes the new value to Fly and restarts the
   machines (`restart_machines = true`); the Doppler→Vercel dashboard
   integration re-syncs within ~30s.

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

Rotate the key in the provider dashboard (Neon / Vercel / Fly), then
update the corresponding secret in the `yata/terraform` Doppler config.
The providers re-authenticate on the next `terraform plan` or `apply`;
no separate Terraform run is needed unless you're simultaneously
applying other changes.

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
- The `yata/terraform` Doppler config is a clickops prerequisite —
  Terraform reads it via a data source but cannot create it (doing so
  would introduce a circular dependency at provider-configuration time).
  See Bootstrap step 3.
