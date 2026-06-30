import { expect, test } from "@playwright/test";

/**
 * Authenticated item-creation flow.
 *
 * These tests run with the session saved by `auth.setup.ts` (see the
 * `chromium-auth` project in playwright.config.ts), so the user is already
 * logged in when each test starts.
 *
 * They depend on the Auth0 login performed by auth.setup.ts. When the test
 * credentials aren't available the setup is skipped and no session is saved,
 * so skip these too (at the file level, before any browser launches) instead
 * of failing on a missing session.
 */

test.skip(
  !process.env.E2E_AUTH0_USERNAME || !process.env.E2E_AUTH0_PASSWORD,
  "E2E_AUTH0_USERNAME / E2E_AUTH0_PASSWORD not set — skipping authenticated tests.",
);

test.describe("Items (authenticated)", () => {
  test("logged-in user can add an item and see it in the list", async ({
    page,
  }) => {
    // Use a unique name so the test is repeatable without colliding with
    // items created by previous runs.
    const itemName = `E2E item ${Date.now()}`;
    const itemDescription = "Created by Playwright e2e test";

    await page.goto("/");

    // Sanity check: we're authenticated (Log out link is present).
    await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();

    // Fill in the create-item form.
    await page.getByPlaceholder("Name").fill(itemName);
    await page.getByPlaceholder("Description (optional)").fill(itemDescription);

    // Submit.
    await page.getByRole("button", { name: "Add item" }).click();

    // The new item should appear in the list after the page revalidates.
    await expect(page.getByText(itemName)).toBeVisible();
    await expect(page.getByText(itemDescription)).toBeVisible();
  });

  test("name is required to add an item", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();

    // Submit with an empty name.
    await page.getByRole("button", { name: "Add item" }).click();

    // The form shows a validation error and does not create an item.
    await expect(page.getByText("Name is required.")).toBeVisible();
  });
});
