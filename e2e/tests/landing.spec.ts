import { test, expect } from "@playwright/test";

/**
 * Public landing page ("/").
 *
 * It reads no session, so these run in the unauthenticated project and
 * assert the marketing content plus the two Auth0 entry points.
 */

test.describe("Landing page", () => {
  test("renders the hero headline and sub-copy", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "A list that only holds today." }),
    ).toBeVisible();

    await expect(
      page.getByText("Write the task, give it a day if it needs one"),
    ).toBeVisible();
  });

  test("sign-up CTAs point at Auth0 with the signup hint", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Start your first list" }),
    ).toHaveAttribute("href", "/auth/login?screen_hint=signup");

    await expect(
      page.getByRole("link", { name: "Start free" }).first(),
    ).toHaveAttribute("href", "/auth/login?screen_hint=signup");
  });

  test("sign-in link points at Auth0 login", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  test("shows the how-it-works steps and pricing", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Type it the way you'd say it" }),
    ).toBeVisible();
    await expect(page.getByText("Up to 3 lists, unlimited tasks.")).toBeVisible();
    await expect(page.getByText("Everything, plus shared lists.")).toBeVisible();
  });

  test("closing banner invites a first task", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Start with one thing you'd rather stop remembering.",
      }),
    ).toBeVisible();
  });
});
