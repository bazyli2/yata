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
 *   - E2E_TEST_USERNAME
 *   - E2E_TEST_PASSWORD
 *
 * If those are missing this setup fails loudly (rather than skipping) so a
 * broken Doppler token or renamed secret can't silently disable the
 * authenticated tests while CI stays green.
 */

export const STORAGE_STATE = path.join(__dirname, ".auth", "session.json");

setup("authenticate via Auth0", async ({ page }) => {
  const username = process.env.E2E_TEST_USERNAME;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Missing E2E_TEST_USERNAME / E2E_TEST_PASSWORD — required for the " +
        "authenticated E2E tests. Run the suite with `devbox run e2e` (which " +
        "wraps `doppler run` to inject secrets), and make sure the E2E test " +
        "user credentials exist in the Doppler config.",
    );
  }

  // Kick off the login flow; the SDK redirects to the Auth0 Universal Login page.
  await page.goto("/auth/login");

  // Auth0 Universal Login form. Target the inputs by their stable id/name
  // attributes rather than by label: the password field's label region also
  // contains a "Show password" toggle, so a label match is ambiguous.
  await page.locator("input[name='username']").fill(username);
  await page.locator("input[name='password']").fill(password);
  // The primary submit button carries name="action"; targeting it avoids
  // matching social login buttons like "Continue with Google".
  await page.locator("button[type='submit'][name='action']").click();

  // After a successful login, Auth0 redirects back to the app at baseURL.
  await page.waitForURL("http://localhost:3000/**");

  // Confirm we're actually authenticated: the home page shows a "Log out"
  // link only when a session exists.
  await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();

  // Persist the authenticated state (cookies + storage) for reuse.
  await page.context().storageState({ path: STORAGE_STATE });
});
