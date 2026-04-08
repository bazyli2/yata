# yata

A Next.js + FastAPI starter, fully managed by [Devbox](https://www.jetify.com/devbox).
No Docker required. Postgres, the API, and the web app all run as Devbox services.

## Stack

- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind, ESLint, Prettier), pnpm
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic Settings, managed by `uv`
- **Database**: PostgreSQL 17 (data dir at `./pgdata`)
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

You only need [Devbox installed](https://www.jetify.com/devbox/docs/installing_devbox/).

```sh
# 1. Enter the dev shell. First run downloads everything,
#    initializes Postgres, runs `uv sync` and `pnpm install`.
devbox shell

# 2. Start postgres + backend + frontend together.
#    -b runs them in the background; omit it to use the TUI.
devbox services up -b

# 3. Apply database migrations (postgres must be running).
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
by the server-only `BACKEND_ORIGIN` env var in `frontend/.env.local`.

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

## Environment files

The init hook seeds these on first `devbox shell`:

- `backend/.env`        ← copied from `backend/.env.example`
- `frontend/.env.local` ← copied from `frontend/.env.local.example`

Edit them as needed.

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
  change `PGPORT` and `DATABASE_URL` in `devbox.json`.
- The built-in devbox `postgresql` and `python` plugins are disabled in
  `devbox.json` so we can manage the data dir (`./pgdata`) and the Python venv
  (`backend/.venv` via `uv`) ourselves.
- `openapi.json` and `frontend/src/lib/api-types.ts` are generated files but
  are committed to git so PR diffs show API changes explicitly. The `typegen`
  devbox service keeps them fresh locally; `devbox run check:types` enforces
  freshness in CI.
