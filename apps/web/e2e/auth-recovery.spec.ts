import { test, expect } from "@playwright/test";

test("un creador recién registrado ve el aviso de verificar email y puede reenviarlo", async ({ page }) => {
  const suffix = Date.now();
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${suffix % 255}` });

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Verify E2E");
  await page.getByLabel(/Usuario/).fill(`verifye2e${suffix}`);
  await page.getByLabel("Email").fill(`verifye2e-${suffix}@example.com`);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();

  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByText("Verificá tu email.")).toBeVisible();

  await page.getByRole("button", { name: "Reenviar enlace" }).click();
  await expect(page.getByText("Te enviamos un nuevo enlace.")).toBeVisible();

  await page.getByRole("button", { name: "Cerrar aviso" }).click();
  await expect(page.getByText("Verificá tu email.")).toHaveCount(0);
});

test("recuperar contraseña muestra un mensaje genérico sin revelar si el email existe", async ({ page }) => {
  await page.goto("/recuperar-contrasena");
  await page.getByLabel("Email").fill(`nadie-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByText("Si existe una cuenta con ese email, te enviamos un enlace")).toBeVisible();
});

test("restablecer contraseña sin token muestra un error claro", async ({ page }) => {
  await page.goto("/restablecer-contrasena");
  await expect(page.getByText("Este enlace no es válido")).toBeVisible();
});

test("cambiar contraseña con la actual incorrecta muestra error", async ({ page }) => {
  const suffix = Date.now();
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${(suffix + 1) % 255}` });

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Seguridad E2E");
  await page.getByLabel(/Usuario/).fill(`seg${suffix}`);
  await page.getByLabel("Email").fill(`seg-${suffix}@example.com`);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  await page.getByRole("link", { name: "Seguridad" }).click();
  await expect(page).toHaveURL(/\/panel\/seguridad/);
  await page.getByLabel("Contraseña actual").fill("contraseña-incorrecta");
  await page.getByLabel("Contraseña nueva").fill("otra-contraseña-nueva");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText("La contraseña actual no es correcta")).toBeVisible();
});

test("cambiar contraseña con la actual correcta funciona y la nueva sirve para volver a entrar", async ({ page }) => {
  const suffix = Date.now();
  const email = `seg-ok-${suffix}@example.com`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${(suffix + 2) % 255}` });

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Seguridad OK E2E");
  await page.getByLabel(/Usuario/).fill(`segok${suffix}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  await page.goto("/panel/seguridad");
  await page.getByLabel("Contraseña actual").fill("password1234");
  await page.getByLabel("Contraseña nueva").fill("una-contraseña-mas-nueva");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText("Contraseña actualizada ✓")).toBeVisible();

  await page.goto("/panel");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("una-contraseña-mas-nueva");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/panel$/);
});
