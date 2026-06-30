import path from "node:path";

import { expect, test as setup } from "@playwright/test";

/**
 * Authentication setup project.
 *
 * Runs once before the rest of the suite (see `dependencies` in
 * playwright.config.ts). It performs a real Auth0 Universal Login with a
 * dedicated test user and saves the authenticated browser state to disk so
 * the actual tests can reuse the session via `storageState` instead of
 * logging in again for every test.
 *
 * Credentials come from environment variables (managed by Doppler):
 *   - E2E_AUTH0_USERNAME
 *   - E2E_AUTH0_PASSWORD
 *
 * When the credentials aren't available (e.g. a fork PR without access to
 * secrets), the setup is skipped at the suite level so no browser is launched.
 * The dependent authenticated tests are skipped too, while the unauthenticated
 * smoke tests still run.
 */

export const STORAGE_STATE = path.join(__dirname, ".auth", "session.json");

const hasCredentials = !!(
  process.env.E2E_AUTH0_USERNAME && process.env.E2E_AUTH0_PASSWORD
);

setup.skip(
  !hasCredentials,
  "E2E_AUTH0_USERNAME / E2E_AUTH0_PASSWORD not set — skipping authenticated tests.",
);

setup("authenticate via Auth0", async ({ page }) => {
  const username = process.env.E2E_AUTH0_USERNAME!;
  const password = process.env.E2E_AUTH0_PASSWORD!;

  // Kick off the login flow; the SDK redirects to the Auth0 Universal Login page.
  await page.goto("/auth/login");

  // Auth0 Universal Login form. The default new Universal Login uses
  // name="username" and name="password" inputs.
  await page.getByLabel(/email|username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /continue|log in|sign in/i }).click();

  // After a successful login, Auth0 redirects back to the app at baseURL.
  await page.waitForURL("http://localhost:3000/**");

  // Confirm we're actually authenticated: the home page shows a "Log out"
  // link only when a session exists.
  await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();

  // Persist the authenticated state (cookies + storage) for reuse.
  await page.context().storageState({ path: STORAGE_STATE });
});
