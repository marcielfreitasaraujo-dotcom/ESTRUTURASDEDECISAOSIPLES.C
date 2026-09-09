import { expect, test } from "@playwright/test";

test("landing e cardápio piloto carregam", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /sistema que a pizzaria usa/i })).toBeVisible();
  await page.goto("/loja/central-da-pizza");
  await expect(page.getByRole("heading", { name: "Central da Pizza" })).toBeVisible();
});
