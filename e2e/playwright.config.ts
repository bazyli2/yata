import { existsSync } from "node:fs";
import path from "node:path";

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

// The authenticated project reuses a session saved by auth.setup.ts. When the
// Auth0 test credentials aren't available the setup is skipped and no session
// file is written, so only point at the file when it actually exists to avoid
// Playwright erroring on a missing storageState path.
const sessionStatePath = path.join(__dirname, "tests", ".auth", "session.json");
const storageState = existsSync(sessionStatePath) ? sessionStatePath : undefined;

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
    // Logs in via Auth0 once and saves the session to disk.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        },
      },
    },
    // Unauthenticated smoke tests — no saved session needed.
    {
      name: "chromium",
      testIgnore: /items\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        },
      },
    },
    // Authenticated tests — reuse the session saved by the setup project.
    {
      name: "chromium-auth",
      testMatch: /items\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState,
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
