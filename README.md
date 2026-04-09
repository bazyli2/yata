# yata

A Next.js + FastAPI starter, fully managed by [Devbox](https://www.jetify.com/devbox).
No Docker required. Postgres, the API, and the web app all run as Devbox services.

## Stack

- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind, ESLint, Prettier), pnpm
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic Settings, managed by `uv`
- **Database**: PostgreSQL 17 (data dir at `./pgdata`)
- **Secrets**: [Doppler](https://www.doppler.com/) — injected at runtime via `doppler run`,
  no `.env` files on disk
- **Process orchestration**: `devbox services` (process-compose under the hood)
- **End-to-end types**: FastAPI OpenAPI → `openapi-typescript` → `openapi-fetch`,
  regenerated automatically by the `typegen` devbox service on every backend save

## Layout

```
yata/
├── devbox.json
├── process-compose.yaml
├── pgdata/                 # gitignored, created on first `devbox shell`
├── frontend/               # Next.js app
└── backend/                # FastAPI app
```

## Quickstart

You need [Devbox installed](https://www.jetify.com/devbox/docs/installing_devbox/)
and access to the `yata` project in [Doppler](https://www.doppler.com/).

```sh
# 1. Enter the dev shell. First run downloads everything,
#    initializes Postgres, runs `uv sync` and `pnpm install`.
#    The init hook will refuse to proceed if Doppler isn't set up yet —
#    see step 2.
devbox shell

# 2. One-time Doppler setup per machine. Re-enter `devbox shell` after
#    this the first time around so the init hook's preflight passes.
doppler login      # opens a browser, authenticates this machine
doppler setup      # reads .doppler.yaml, pins project=yata config=dev
                   # for both ./backend and ./frontend

# 3. Start postgres + backend + frontend together.
#    Secrets are injected into backend/frontend via `doppler run`.
#    -b runs them in the background; omit it to use the TUI.
devbox services up -b

# 4. Apply database migrations (postgres must be running).
devbox run migrate
```

Then open:

- Frontend: <http://localhost:3000>
- API docs: <http://localhost:8000/docs>
- Health:   <http://localhost:8000/api/health>

Stop all services with `devbox services stop`.

The frontend proxies `/api/*` to FastAPI via Next.js `rewrites()` (see
`frontend/next.config.ts`), so the browser only ever talks to
`http://localhost:3000` — no CORS involved. The destination is controlled
by the server-only `BACKEND_ORIGIN` env var, which comes from Doppler.

## Common commands

All commands assume you are inside `devbox shell`.

| Command                            | Description                                |
| ---------------------------------- | ------------------------------------------ |
| `devbox services up`               | Start postgres, backend, frontend (TUI)    |
| `devbox services up -b`            | Same, in the background                    |
| `devbox services stop`             | Stop all services                          |
| `devbox run fe`                    | Run only the frontend dev server           |
| `devbox run be`                    | Run only the backend dev server            |
| `devbox run test`                  | Run backend pytest suite                   |
| `devbox run migrate`               | `alembic upgrade head` (needs postgres up) |
| `devbox run makemigration "msg"`   | `alembic revision --autogenerate`          |
| `devbox run db:start`              | Start only the postgres service            |
| `devbox run db:stop`               | Stop only the postgres service             |
| `devbox run db:psql`               | Open `psql` against the local DB           |
| `devbox run db:reset`              | Drop & recreate the `app` database         |
| `devbox run lint`                  | Lint frontend (ESLint) and backend (ruff)  |
| `devbox run format`                | Format frontend (Prettier) and backend     |
| `devbox run typecheck`             | `tsc --noEmit` on the frontend             |
| `devbox run gen:types`             | Regenerate `openapi.json` + `api-types.ts` |
| `devbox run gen:types:watch`       | Run the type generator watcher standalone |
| `devbox run check:types`           | CI-friendly: regen + fail if anything drifted |

## Secrets (Doppler)

All backend and frontend secrets are managed by [Doppler](https://www.doppler.com/).
There are **no `.env` files** in this repo — running `doppler run -- <cmd>`
injects the current config's secrets as environment variables, and
`pydantic-settings` / Next.js pick them up the same way they would from
a `.env` file.

The `doppler` CLI is installed automatically by Devbox (it's in
`devbox.json → packages`), so you only need to install and configure it
per machine, not per clone.

### Layout

- **Project**: `yata`
- **Configs**: `dev` (local), and whatever you add for staging/prod
- **Scoping**: [`.doppler.yaml`](./.doppler.yaml) at the repo root pins
  project + config per subdirectory so `doppler run` inside `backend/`
  resolves backend secrets and inside `frontend/` resolves frontend
  secrets — from the same config, without variable-name collisions.

### Variables currently expected

| Scope     | Variable         | Used by                                   |
| --------- | ---------------- | ----------------------------------------- |
| backend   | `DB_HOST`        | `app.config.Settings.db_host`             |
| backend   | `DB_PORT`        | `app.config.Settings.db_port`             |
| backend   | `DB_USER`        | `app.config.Settings.db_user`             |
| backend   | `DB_PASSWORD`    | `app.config.Settings.db_password`         |
| backend   | `DB_NAME`        | `app.config.Settings.db_name`             |
| backend   | `CORS_ORIGINS`   | `app.config.Settings.cors_origins`        |
| frontend  | `BACKEND_ORIGIN` | `frontend/src/lib/env.ts` (server-only)   |

If you add a new env var, add it to the Doppler `dev` config and
document it here.

### First-time setup

```sh
doppler login      # one-time browser auth per machine
doppler setup      # reads .doppler.yaml, confirms project/config per scope
```

Sanity-check the scopes:

```sh
(cd backend  && doppler secrets)
(cd frontend && doppler secrets)
```

### Running things outside devbox scripts

Every `devbox run ...` script and every `process-compose.yaml` process
that needs secrets already wraps the real command in `doppler run`, so
`devbox services up`, `devbox run be`, `devbox run fe`, `devbox run test`,
and `devbox run migrate` all work transparently.

If you invoke `uv run ...` or `pnpm ...` directly (outside devbox
scripts), prefix it with `doppler run --`:

```sh
cd backend  && doppler run -- uv run pytest
cd frontend && doppler run -- pnpm dev
```

### Switching environments

Either edit `.doppler.yaml` and commit, or override locally:

```sh
doppler configure set config stg --scope ./backend
doppler configure set config stg --scope ./frontend
```

### Adding or rotating secrets

Do it in the Doppler dashboard (or `doppler secrets set FOO=bar`). No
code or redeploy required for local dev — next invocation of
`doppler run` picks up the new value. Running services don't auto-reload
on secret changes; restart them with `devbox services restart backend`
or similar.

## End-to-end types

The FastAPI backend is the single source of truth for the API schema.
A devbox service called **`typegen`** watches `backend/app/**/*.py` and, on
every save, regenerates two files:

- `openapi.json`                   — the OpenAPI 3.1 schema dumped from
  `app.main.app.openapi()` via `backend/app/scripts/dump_openapi.py`
- `frontend/src/lib/api-types.ts`  — TypeScript types produced by
  [`openapi-typescript`](https://openapi-ts.dev/) from the schema above

The frontend uses [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) so
every call is fully typed — path, query, request body, and response:

```ts
// frontend/src/lib/api.ts
import { api } from "@/lib/api";

const { data, error } = await api.GET("/api/items");
// data is ItemRead[] | undefined, error is typed too

await api.POST("/api/items", {
  body: { name: "hello", description: "world" },
  //     ^ autocompleted and type-checked against Pydantic ItemCreate
});
```

### How real-time IDE feedback works

1. Start the full stack with `devbox services up -b` (this also starts `typegen`).
2. Edit a Pydantic model, schema, or router in `backend/app/**/*.py` and save.
3. Within ~1 s:
   - `watchfiles` sees the change and re-runs `dump_openapi.py`.
   - `openapi-typescript` rewrites `frontend/src/lib/api-types.ts`.
   - The TypeScript language server in your editor picks up the new types
     and re-typechecks the frontend automatically.
4. Any frontend call that no longer matches the backend shows red squiggles
   immediately. Run `devbox run typecheck` to confirm, or rely on `next dev`
   to surface the errors.

If you're iterating on schemas without needing postgres/frontend running,
`devbox run gen:types:watch` runs just the watcher standalone.

If your editor ever seems to show stale types, restart the TypeScript server:

- **VS Code / Cursor**: `Cmd/Ctrl+Shift+P → "TypeScript: Restart TS Server"`
- **JetBrains**: `File → Reload All from Disk`
- **Neovim (tsserver)**: `:LspRestart`

### CI check

`devbox run check:types` regenerates `openapi.json` and `api-types.ts` and
fails if either file differs from what's committed. Wire this into CI to
prevent merging PRs where the generated types are stale.

## Working with migrations

```sh
# Create a new revision after editing app/models/*.py
devbox run makemigration "add foo column"

# Apply pending migrations (postgres must be running)
devbox run migrate
```

If you only need the database (e.g. to run migrations without starting the
whole stack), use `devbox run db:start` and `devbox run db:stop`.

## Notes

- Postgres data lives in `./pgdata` (gitignored). To start completely fresh,
  stop services and `rm -rf pgdata` — the next `devbox shell` will reinitialize it.
- The backend service does **not** auto-run migrations. Run `devbox run migrate`
  manually after creating new revisions.
- Port 5432 must be free. If you already run a system Postgres, stop it or
  change `PGPORT` in `devbox.json` and the corresponding `DB_PORT` in your
  Doppler `dev` config.
- The built-in devbox `postgresql` and `python` plugins are disabled in
  `devbox.json` so we can manage the data dir (`./pgdata`) and the Python venv
  (`backend/.venv` via `uv`) ourselves.
- `openapi.json` and `frontend/src/lib/api-types.ts` are generated files but
  are committed to git so PR diffs show API changes explicitly. The `typegen`
  devbox service keeps them fresh locally; `devbox run check:types` enforces
  freshness in CI.
