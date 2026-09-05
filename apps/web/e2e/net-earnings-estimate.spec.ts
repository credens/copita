import { test, expect } from "@playwright/test";

test("el editor de perfil muestra cuánto le queda neto al creador, y se actualiza si cambia el precio", async ({ page }) => {
  const suffix = Date.now();
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${(suffix + 20) % 255}` });

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Fee Estimate E2E");
  await page.getByLabel(/Usuario/).fill(`feeest${suffix}`);
  await page.getByLabel("Email").fill(`feeest-${suffix}@example.com`);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  await page.goto("/panel/perfil");
  await expect(page.getByText("¿Cuánto te queda neto?")).toBeVisible();
  await expect(page.getByText("Acreditación inmediata")).toBeVisible();
  await expect(page.getByText("Acreditación a 14 días")).toBeVisible();

  const priceInput = page.getByLabel("Precio de una copita (USD de referencia)");
  const firstEstimateRow = page.locator("table.receipt tr").first();
  const before = await firstEstimateRow.textContent();

  await priceInput.fill("10");
  await expect(async () => {
    const after = await firstEstimateRow.textContent();
    expect(after).not.toEqual(before);
  }).toPass();
});
