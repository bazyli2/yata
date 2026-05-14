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
├── doppler.tf      # prd secrets + Fly sync; reads yata/terraform
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
   - Neon org ID: <https://console.neon.tech/app/settings/general>
     (looks like `org-xxx-yyy-12345678`)
   - Vercel: <https://vercel.com/account/tokens> (full account scope)
   - Fly: `flyctl tokens create personal` (personal access token —
     org tokens don't work with the Machines API)
   - Doppler: a personal token (free tier) or service-account token
     (paid tier) with access to the `yata` project

3. **Create Doppler configs (clickops prerequisite).**
   Terraform *reads* these configs but does not *create* them. The
   `yata/terraform` config can't be Terraform-managed because the
   providers need its API keys to configure themselves (circular
   dependency). The `yata/prd` config follows the same pattern for
   consistency — the Doppler provider doesn't expose individual
   environment/config data sources, so we reference both by literal
   name. Terraform manages the *secrets inside* `prd`, not the
   container itself. In the Doppler dashboard:

   1. Create environment **Terraform** (slug `terraform`) under project
      `yata`.
   2. Create config **terraform** under that environment.
   3. Create environment **Production** (slug `prd`) under project
      `yata`.
   4. Create config **prd** under that environment.
   5. Add secrets to `yata/terraform`:

      | Secret             | Value source                                     |
      | ------------------ | ------------------------------------------------ |
      | `NEON_API_KEY`     | Neon API key from step 2                         |
      | `NEON_ORG_ID`      | Neon org ID from step 2 (`org-xxx-yyy-12345678`) |
      | `VERCEL_API_TOKEN` | Vercel access token from step 2                  |
      | `FLY_API_TOKEN`    | Fly **personal** access token from step 2        |

4. **Add `DOPPLER_TOKEN` to TFC as a sensitive workspace env var.**
   This is the only TFC secret — everything else lives in Doppler.

   | Variable        | Purpose                                     |
   | --------------- | ------------------------------------------- |
   | `DOPPLER_TOKEN` | Authenticates the Doppler provider; must     |
   |                 | have access to `yata/terraform` (read) and  |
   |                 | `yata/prd` (read + write)                   |

5. **Queue the first run in the TFC UI.** Review the plan, confirm apply.
   This creates everything end-to-end: Neon project, Fly app (placeholder
   image), Vercel project, Doppler `prd` secrets, and the Doppler→Fly
   sync.

5b. **Configure the Doppler→Vercel sync (clickops, post-apply).**
    The Doppler Terraform provider doesn't ship a Vercel integration
    resource, so this is a one-time dashboard step:

    1. In Doppler, project `yata` → config `prd` → **Integrations** →
       **Add Sync** → **Vercel**.
    2. Authenticate Doppler to Vercel (OAuth flow).
    3. Target: project `yata`, environment **Production**.
    4. Filter: sync only `BACKEND_ORIGIN` (keeps `DB_PASSWORD` etc. out
       of Vercel).
    5. Save. Doppler pushes within seconds.

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
- The `yata/terraform` and `yata/prd` Doppler environments + configs
  are clickops prerequisites — Terraform manages secrets *inside* `prd`
  but not the containers themselves. `yata/terraform` can't be
  Terraform-managed (circular dependency with providers);
  `yata/prd` follows the same pattern for consistency and because the
  Doppler provider lacks individual environment/config data sources.
  See Bootstrap step 3.
