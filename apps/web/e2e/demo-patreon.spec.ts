import { test, expect } from "@playwright/test";

test("la demo estilo Patreon muestra el mismo perfil con otro look y linkea de vuelta a /demo", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("link", { name: "Ver la misma página con otro estilo →" }).click();
  await expect(page).toHaveURL(/\/demo-patreon$/);

  await expect(page.getByRole("heading", { name: "Mica Streams" })).toBeVisible();
  await expect(page.getByText("Exploración de estilo con el DESIGN.md de Patreon")).toBeVisible();

  await page.getByRole("link", { name: /Ver versión/ }).click();
  await expect(page).toHaveURL(/\/demo$/);
});

test("la home estilo Patreon muestra el mismo contenido de la home real y linkea entre las dos demos", async ({ page }) => {
  await page.goto("/demo-patreon-home");

  await expect(page.getByRole("heading", { name: "Invitá una copita a tus creadores favoritos." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1. Creá tu cuenta" })).toBeVisible();
  await expect(page.getByText("Exploración de estilo con el DESIGN.md de Patreon")).toBeVisible();

  await page.getByRole("link", { name: "perfil de creador con este estilo" }).click();
  await expect(page).toHaveURL(/\/demo-patreon$/);

  await expect(page.getByRole("link", { name: "home con este estilo" })).toBeVisible();
});
