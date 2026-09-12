import { expect, test } from "@playwright/test";

test("landing e cardápio piloto carregam", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /sistema que a pizzaria usa/i })).toBeVisible();
  await page.goto("/loja/central-da-pizza");
  await expect(page.getByRole("heading", { name: "Pizzaria Central da Velha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pizza P" })).toBeVisible();
  await expect(page.getByRole("button", { name: /carrinho/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /entrar\/cadastrar/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /acompanhar pedido/i })).toBeVisible();
  await expect(page.getByText("Estabelecimento fechado").or(page.getByRole("button", { name: /Finalizar pedido/ }))).toBeVisible();

  await page.getByRole("button", { name: /entrar\/cadastrar/i }).click();
  await expect(page.getByRole("heading", { name: /informe seu nome e telefone/i })).toBeVisible();
  await page.getByRole("textbox", { name: "Nome" }).fill("Marciel Teste");
  await page.getByRole("textbox", { name: "Telefone" }).fill("91991515550");
  await page.getByRole("button", { name: /^confirmar$/i }).click();
  await expect(page.getByRole("button", { name: /olá, marciel/i })).toBeVisible();
});
