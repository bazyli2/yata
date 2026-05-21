import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for the yata monorepo.
 *
 * By default the `webServer` entries start both the FastAPI backend and the
 * Next.js frontend via `doppler run`, mirroring local `devbox services`.
 *
 * In CI the servers are started separately (see .github/workflows/ci.yml),
 * so `webServer` is skipped when the `CI` env var is set.
 */

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "blob" : "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        },
      },
    },
  ],

  /* Start backend + frontend locally; skipped in CI where they're managed
     by the workflow itself. */
  ...(isCI
    ? {}
    : {
        webServer: [
          {
            command:
              "doppler run -- uv run uvicorn app.main:app --host 0.0.0.0 --port 8000",
            cwd: "../backend",
            url: "http://localhost:8000/api/health",
            reuseExistingServer: true,
            timeout: 30_000,
          },
          {
            command: "doppler run -- pnpm dev --port 3000",
            cwd: "../frontend",
            url: "http://localhost:3000",
            reuseExistingServer: true,
            timeout: 30_000,
          },
        ],
      }),
});
