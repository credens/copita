import { test, expect } from "@playwright/test";

test("la página de demo muestra un perfil de ejemplo y no cobra nada de verdad", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Ver un perfil de ejemplo" }).click();
  await expect(page).toHaveURL(/\/demo$/);

  await expect(page.getByRole("heading", { name: "Mica Streams" })).toBeVisible();
  await expect(page.getByText("Muro de apoyos")).toBeVisible();
  await expect(page.getByText("amo tus streams, gracias por compartir el proceso!")).toBeVisible();

  await page.getByRole("button", { name: "Pagar con Mercado Pago" }).click();
  await expect(page.getByText("Esto es una demo — acá no se cobra nada de verdad.").first()).toBeVisible();

  await page.getByRole("button", { name: /Unirme por/ }).click();
  await expect(page.getByText("Esto es una demo — acá no se cobra nada de verdad.").nth(1)).toBeVisible();
});
