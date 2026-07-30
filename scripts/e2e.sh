#!/usr/bin/env bash
#
# Run the end-to-end (Playwright) suite against an isolated, disposable
# service stack. This is the entry point behind `devbox run e2e` /
# `devbox run e2e:ui`.
#
# It:
#   1. Brings up the E2E stack (postgres + a fresh app_e2e DB + backend +
#      frontend) defined in e2e/process-compose.e2e.yaml, detached.
#   2. Waits for the backend and frontend to become healthy.
#   3. Runs Playwright (any args passed to this script are forwarded, e.g.
#      --ui or a test filter).
#   4. Tears the stack back down on exit — success, failure, or Ctrl-C —
#      so nothing lingers and the primary dev `app` database is untouched.
#
# The stack binds :5432 / :8000 / :3000, so a running `devbox run dev`
# session must be stopped first; we detect that and fail with a clear message.
set -euo pipefail

# Resolve repo root regardless of where the script is invoked from.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="e2e/process-compose.e2e.yaml"
# Dedicated API port so this process-compose instance never collides with a
# dev `devbox services` instance (which uses the default 8080). `up` takes the
# config file; client commands (down / process list) connect via --port only.
PC_PORT=9977
PC_UP=(process-compose -f "$COMPOSE_FILE" --port "$PC_PORT")
PC_CLIENT=(process-compose --port "$PC_PORT")

cleanup() {
  echo "[e2e] Tearing down the E2E stack..."
  # Stop the whole stack (Postgres included). The app_e2e database can't be
  # dropped here because the backend still holds connections to it; instead it
  # is dropped-and-recreated fresh at the start of every run by the db-setup
  # process, so a leftover between runs is harmless.
  "${PC_CLIENT[@]}" down >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Fail fast with a clear message if the dev stack (or anything else) is
# already holding the ports we need. The E2E stack owns Postgres (5432) plus
# the backend (8000) and frontend (3000), so all three must be free.
conflict=""
if pg_isready -h 127.0.0.1 -p "${PGPORT:-5432}" >/dev/null 2>&1; then
  conflict="PostgreSQL (:${PGPORT:-5432})"
fi
for port in 8000 3000; do
  if curl -sf "http://localhost:${port}" >/dev/null 2>&1; then
    conflict="${conflict:+$conflict, }:${port}"
  fi
done
if [ -n "$conflict" ]; then
  echo "[e2e] ERROR: these are already in use: ${conflict}." >&2
  echo "[e2e] The E2E stack starts its own Postgres/backend/frontend, so stop" >&2
  echo "[e2e] your dev services first (quit 'devbox run dev' / 'devbox services" >&2
  echo "[e2e] stop'), then re-run 'devbox run e2e'." >&2
  exit 1
fi

echo "[e2e] Starting the E2E stack (fresh app_e2e database)..."
"${PC_UP[@]}" up --detached --tui=false >/dev/null

# Wait for backend + frontend readiness.
wait_for() {
  local name="$1" url="$2" deadline=$((SECONDS + 90))
  echo "[e2e] Waiting for ${name} (${url})..."
  until curl -sf "$url" >/dev/null 2>&1; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      echo "[e2e] ERROR: ${name} did not become ready within 90s." >&2
      "${PC_CLIENT[@]}" process list || true
      exit 1
    fi
    sleep 1
  done
}

wait_for "backend" "http://localhost:8000/api/health"
wait_for "frontend" "http://localhost:3000"
echo "[e2e] Stack ready."

echo "[e2e] Running Playwright..."
cd e2e
doppler run -- pnpm exec playwright test "$@"
