import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders the page heading", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "yata starter" }),
    ).toBeVisible();
  });

  test("shows backend health section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Backend health" }),
    ).toBeVisible();
  });

  test("shows items section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Items" }),
    ).toBeVisible();
  });
});
