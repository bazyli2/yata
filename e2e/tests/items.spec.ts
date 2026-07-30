import { expect, test } from "@playwright/test";

/**
 * Authenticated item-creation flow.
 *
 * These tests run with the session saved by `auth.setup.ts` (see the
 * `chromium-auth` project in playwright.config.ts), so the user is already
 * logged in when each test starts.
 *
 * They depend on the `setup` project. If the Auth0 login there fails (e.g.
 * missing credentials), Playwright reports these as not-run via the failed
 * dependency — no session is silently skipped over.
 */

test.describe("Items (authenticated)", () => {
  test("logged-in user can add an item and see it in the list", async ({
    page,
  }) => {
    // Use unique values so the test is repeatable without colliding with
    // items created by previous runs (the DB persists between runs locally).
    const unique = Date.now();
    const itemName = `E2E item ${unique}`;
    const itemDescription = `Created by Playwright e2e test ${unique}`;

    await page.goto("/");

    // Sanity check: we're authenticated (Log out link is present).
    await expect(page.getByRole("link", { name: /log out/i })).toBeVisible();

    // Fill in the create-item form.
    await page.getByPlaceholder("Name").fill(itemName);
    await page.getByPlaceholder("Description (optional)").fill(itemDescription);

    // Submit.
    await page.getByRole("button", { name: "Add item" }).click();

    // The new item should appear in the list after the page revalidates.
    // Scope the assertions to the specific list item so accumulated items
    // from earlier runs don't cause strict-mode ambiguity.
    const newItem = page.getByRole("listitem").filter({ hasText: itemName });
    await expect(newItem).toBeVisible();
    await expect(newItem.getByText(itemDescription)).toBeVisible();
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
