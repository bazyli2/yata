import { execSync } from "node:child_process";

/**
 * Playwright global setup.
 *
 * Locally, the Playwright `webServer` config starts the backend and frontend,
 * but the backend needs PostgreSQL running with migrations applied — otherwise
 * DB-backed endpoints (e.g. POST /api/items) return 500 and the authenticated
 * item tests fail confusingly.
 *
 * This ensures Postgres is up and migrations are applied before any tests run.
 * It is a no-op in CI, where Postgres is a service container and migrations
 * are applied by the workflow (and `webServer` is skipped).
 */
async function globalSetup() {
  if (process.env.CI) return;

  const run = (cmd: string, cwd?: string) =>
    execSync(cmd, { cwd, stdio: "inherit", shell: "/bin/sh" });

  // Is Postgres already accepting TCP connections on localhost:5432?
  let pgReady = false;
  try {
    execSync("pg_isready -h 127.0.0.1 -p 5432", { stdio: "ignore" });
    pgReady = true;
  } catch {
    pgReady = false;
  }

  if (!pgReady) {
    console.log("[e2e] Starting PostgreSQL (devbox service)...");
    // Start just the postgres process in the background via devbox services.
    run("devbox services up postgres -b");
    // Wait for readiness.
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      try {
        execSync("pg_isready -h 127.0.0.1 -p 5432", { stdio: "ignore" });
        pgReady = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!pgReady) {
      throw new Error("[e2e] PostgreSQL did not become ready within 30s.");
    }
  }

  console.log("[e2e] Applying database migrations...");
  run("doppler run -- uv run alembic upgrade head", "../backend");
}

export default globalSetup;
