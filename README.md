# yata

A Next.js + FastAPI starter, fully managed by [Devbox](https://www.jetify.com/devbox).
No Docker required. Postgres, the API, and the web app all run as Devbox services.

## Stack

- **Frontend**: Next.js 15 (App Router, TypeScript, Tailwind, ESLint, Prettier), pnpm
- **Backend**: FastAPI, SQLAlchemy 2.0, Alembic, Pydantic Settings, managed by `uv`
- **Database**: PostgreSQL 17 (data dir at `./pgdata`)
- **Process orchestration**: `devbox services` (process-compose under the hood)

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

## Environment files

The init hook seeds these on first `devbox shell`:

- `backend/.env`        ← copied from `backend/.env.example`
- `frontend/.env.local` ← copied from `frontend/.env.local.example`

Edit them as needed.

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
