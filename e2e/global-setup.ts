/**
 * Playwright global setup — preflight check.
 *
 * Playwright does not start any servers. The service stack (Postgres + a
 * disposable app_e2e database + backend + frontend) is brought up outside
 * Playwright:
 *   - Locally by scripts/e2e.sh (behind `devbox run e2e`).
 *   - In CI by the workflow (.github/workflows/ci.yml).
 *
 * This just verifies the backend and frontend are reachable before any tests
 * run, and fails loudly with guidance if they aren't — rather than letting
 * every test fail with an opaque connection error.
 */

const BACKEND_HEALTH = "http://localhost:8000/api/health";
const FRONTEND_URL = "http://localhost:3000";

async function assertReachable(name: string, url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) {
      throw new Error(`${name} returned HTTP ${res.status}`);
    }
  } catch (cause) {
    throw new Error(
      `E2E preflight failed: ${name} is not reachable at ${url}.\n` +
        "The E2E stack isn't running. Start the suite with `devbox run e2e`, " +
        "which brings up an isolated backend/frontend/database, runs the tests, " +
        "and tears the stack down afterwards. (Do not run `playwright test` " +
        "directly — it no longer starts the servers itself.)",
      { cause },
    );
  }
}

async function globalSetup() {
  await assertReachable("backend", BACKEND_HEALTH);
  await assertReachable("frontend", FRONTEND_URL);
}

export default globalSetup;
