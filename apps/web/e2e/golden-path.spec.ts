import { test, expect } from "@playwright/test";

// Recorre el camino dorado sin depender de credenciales reales de Mercado
// Pago: registro -> panel -> editar perfil -> perfil público (sin conectar
// MP, así que el checkout no se puede completar acá) -> logout.
test("un creador se registra, edita su perfil y ve su página pública", async ({ page }) => {
  const suffix = Date.now();
  const username = `e2e${suffix}`;
  const email = `e2e-${suffix}@example.com`;

  // El rate limit de /api/auth/register es por IP; sin esto, correr la suite
  // localmente varias veces seguidas pega siempre contra el mismo balde
  // ("unknown", sin x-forwarded-for) y termina en 429 a la quinta corrida.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${suffix % 255}` });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Invitá una copita/i })).toBeVisible();

  await page.getByRole("link", { name: "Crear mi perfil de creador" }).click();
  await expect(page).toHaveURL(/\/registro/);

  await page.getByLabel("Nombre").fill("E2E Creator");
  await page.getByLabel(/Usuario/).fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();

  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByRole("heading", { name: `Hola, E2E Creator` })).toBeVisible();
  await expect(page.getByText("Conectá Mercado Pago para poder cobrar")).toBeVisible();

  await page.getByRole("link", { name: "Editar mi perfil" }).click();
  await expect(page).toHaveURL(/\/panel\/perfil/);
  await page.getByLabel("Bio").fill("Cuenta de prueba end-to-end");
  await page.getByLabel(/Tags/).fill("test, e2e");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Guardado ✓")).toBeVisible();

  await page.goto(`/${username}`);
  await expect(page.getByRole("heading", { name: "E2E Creator" })).toBeVisible();
  await expect(page.getByText("Cuenta de prueba end-to-end")).toBeVisible();
  await expect(page.getByText("Este creador todavía no conectó Mercado Pago")).toBeVisible();

  // Sin MP conectado, no debería listarse en /explorar.
  await page.goto("/explorar");
  await expect(page.getByText(`@${username}`)).toHaveCount(0);

  await page.goto("/panel");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/panel");
  await expect(page).toHaveURL(/\/login/);
});

test("login con credenciales incorrectas muestra un error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nadie@example.com");
  await page.getByLabel("Contraseña").fill("cualquiera");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText(/Email o contraseña incorrectos|No se pudo ingresar/)).toBeVisible();
});
