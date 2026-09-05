import { test, expect } from "@playwright/test";

// Disposición 954/2025: botón de arrepentimiento y de baja de servicio deben
// estar a simple vista desde el primer acceso, no escondidos en el panel —
// no hace falta que sean grandes, alcanza con que estén en todas las páginas
// (acá vía el footer global, que se muestra en la home igual que en todas).
test("los links de arrepentimiento y baja de servicio están visibles en la home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Arrepentimiento" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Baja de servicio" }).first()).toBeVisible();
});

test("baja de servicio: buscar sin resultados no rompe la página", async ({ page }) => {
  await page.goto("/baja");
  await page.getByLabel("Tu email").fill(`nadie-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Buscar mis suscripciones" }).click();
  await expect(page.getByText("No encontramos suscripciones activas con ese email.")).toBeVisible();
});

test("arrepentimiento: buscar sin resultados no rompe la página", async ({ page }) => {
  await page.goto("/arrepentimiento");
  await page.getByLabel("Tu email").fill(`nadie-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Buscar mis copitas" }).click();
  await expect(page.getByText("No encontramos copitas acreditadas con ese email.")).toBeVisible();
});
