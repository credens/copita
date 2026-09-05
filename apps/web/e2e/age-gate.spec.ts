import { test, expect } from "@playwright/test";

test("un perfil marcado +18 muestra el aviso a un visitante y no filtra el nombre real hasta confirmar", async ({ page, context }) => {
  const suffix = Date.now();
  const username = `mature${suffix}`;
  const name = "Perfil Mayores E2E";
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${(suffix + 7) % 255}` });

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel(/Usuario/).fill(username);
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  await page.goto("/panel/perfil");
  await page.getByLabel(/mayores de 18 años/).check();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Guardado ✓")).toBeVisible();

  // Visitante anónimo: contexto sin las cookies de sesión del creador.
  const visitor = await context.browser()!.newContext();
  const visitorPage = await visitor.newPage();
  await visitorPage.goto(`/${username}`);

  await expect(visitorPage.getByText("Contenido para mayores de edad")).toBeVisible();
  await expect(visitorPage.getByRole("heading", { name })).toHaveCount(0);
  expect(await visitorPage.content()).not.toContain(name);

  await visitorPage.getByRole("button", { name: "Soy mayor de 18 años" }).click();
  await expect(visitorPage.getByRole("heading", { name })).toBeVisible();

  await visitor.close();
});
