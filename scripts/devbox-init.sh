#!/usr/bin/env bash
# Devbox shell init: idempotent setup for Postgres data dir and deps.
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

install_precommit_hooks() {
  # Only inside a git work tree with a config present.
  if [ ! -f .pre-commit-config.yaml ] || ! git rev-parse --git-dir >/dev/null 2>&1; then
    return
  fi
  local hooks_dir
  hooks_dir="$(git rev-parse --git-path hooks)"
  # Install commit-time hooks if missing.
  if [ ! -f "$hooks_dir/pre-commit" ]; then
    echo "[devbox] Installing pre-commit git hooks"
    pre-commit install >/dev/null
  fi
  # Install the slower pre-push hooks (typecheck, pytest) if missing.
  if [ ! -f "$hooks_dir/pre-push" ]; then
    echo "[devbox] Installing pre-commit pre-push git hooks"
    pre-commit install --hook-type pre-push >/dev/null
  fi
}

ensure_postgres
install_backend
install_frontend
install_precommit_hooks
