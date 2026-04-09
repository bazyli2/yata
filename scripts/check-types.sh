#!/usr/bin/env bash
#
# Regenerate openapi.json and frontend/src/lib/api-types.ts and fail if either
# file drifts from what's committed. This is the same check that runs in CI
# (see .github/workflows/ci.yml → types-fresh job) and as a pre-push hook
# (see .pre-commit-config.yaml → openapi-types-fresh).
#
# Prefers `devbox run gen:types` if Devbox is available, otherwise falls back
# to invoking uv and pnpm directly. Either way, the behavior is identical:
# regenerate, then `git diff --exit-code` on the generated files.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if command -v devbox >/dev/null 2>&1 && [[ -f devbox.json ]]; then
  devbox run gen:types
else
  (cd backend && uv run python -m app.scripts.dump_openapi > ../openapi.json)
  (cd frontend && pnpm exec openapi-typescript ../openapi.json -o src/lib/api-types.ts)
fi

if ! git diff --exit-code -- openapi.json frontend/src/lib/api-types.ts; then
  echo ""
  echo "error: Generated OpenAPI artifacts are out of date."
  echo "       Run 'devbox run gen:types' (or 'scripts/check-types.sh') locally"
  echo "       and commit the updated openapi.json and api-types.ts."
  exit 1
fi
