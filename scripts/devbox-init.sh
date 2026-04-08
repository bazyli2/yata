#!/usr/bin/env bash
# Devbox shell init: idempotent setup for Postgres data dir, env files, and deps.
set -euo pipefail

ensure_postgres() {
  if [ -f "$PGDATA/PG_VERSION" ]; then
    return
  fi
  echo "[devbox] Initializing PostgreSQL data directory at $PGDATA"
  mkdir -p "$PGDATA"
  initdb -D "$PGDATA" --auth=trust --username="$PGUSER" --encoding=UTF8 >/dev/null
  echo "[devbox] Starting Postgres briefly to create database $PGDATABASE"
  pg_ctl -D "$PGDATA" -l "$PGDATA/init.log" -o "-k $PGHOST -p $PGPORT" -w start
  createdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE"
  pg_ctl -D "$PGDATA" -w stop
  echo "[devbox] Postgres ready."
}

seed_env_file() {
  local target="$1" example="$2"
  if [ ! -f "$target" ] && [ -f "$example" ]; then
    cp "$example" "$target"
    echo "[devbox] Seeded $target from $example"
  fi
}

install_backend() {
  if [ -f backend/pyproject.toml ] && [ ! -d backend/.venv ]; then
    echo "[devbox] Installing backend Python dependencies via uv"
    (cd backend && uv sync)
  fi
}

install_frontend() {
  if [ -f frontend/package.json ] && [ ! -d frontend/node_modules ]; then
    echo "[devbox] Installing frontend dependencies via pnpm"
    (cd frontend && pnpm install)
  fi
}

ensure_postgres
seed_env_file backend/.env backend/.env.example
seed_env_file frontend/.env.local frontend/.env.local.example
install_backend
install_frontend
