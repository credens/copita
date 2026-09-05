import { test, expect } from "@playwright/test";

test("un admin marca +18 no declarado, el creador lo ve en su panel y se resuelve solo al declararlo", async ({ page, context }) => {
  const suffix = Date.now();
  const creatorUsername = `violador${suffix}`;
  const creatorEmail = `${creatorUsername}@example.com`;
  const adminEmail = "admin@copita.ar"; // ver PLATFORM_ADMIN_EMAILS en .env.test

  await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${(suffix + 11) % 255}` });

  // Creador infractor
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Creador Infractor");
  await page.getByLabel(/Usuario/).fill(creatorUsername);
  await page.getByLabel("Email").fill(creatorEmail);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  // Admin en un contexto aparte, marca la multa. El email de admin es fijo
  // (tiene que matchear PLATFORM_ADMIN_EMAILS), así que en corridas repetidas
  // el registro ya existe — se loguea en cambio de registrar de nuevo.
  const adminContext = await context.browser()!.newContext();
  const adminIp = `203.0.113.${(suffix + 12) % 255}`;
  const registerAdmin = await adminContext.request.post("/api/auth/register", {
    headers: { "x-forwarded-for": adminIp },
    data: { name: "Admin E2E", username: `admine2e${suffix}`, email: adminEmail, password: "password1234" },
  });
  if (!registerAdmin.ok()) {
    const login = await adminContext.request.post("/api/auth/login", { headers: { "x-forwarded-for": adminIp }, data: { email: adminEmail, password: "password1234" } });
    expect(login.ok()).toBe(true);
  }
  const adminPage = await adminContext.newPage();
  await adminPage.setExtraHTTPHeaders({ "x-forwarded-for": adminIp });

  await adminPage.goto("/admin");
  await expect(adminPage.getByRole("heading", { name: "Panel interno" })).toBeVisible();
  await adminPage.getByLabel("Usuario del creador").fill(creatorUsername);
  await adminPage.getByLabel("Motivo").fill("fotos +18 en el perfil sin declarar");
  await adminPage.getByRole("button", { name: "Marcar +18 no declarado" }).click();
  await expect(adminPage.getByText(`@${creatorUsername}`)).toBeVisible();

  // El creador ve el aviso de multa en su panel
  await page.goto("/panel");
  await expect(page.getByText("Multa activa: contenido +18 no declarado.")).toBeVisible();

  // Declara +18 -> se resuelve sola
  await page.goto("/panel/perfil");
  await page.getByLabel(/mayores de 18 años/).check();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Guardado ✓")).toBeVisible();

  await page.goto("/panel");
  await expect(page.getByText("Multa activa: contenido +18 no declarado.")).toHaveCount(0);

  // Ya no aparece como activa en el admin
  await adminPage.goto("/admin");
  await expect(adminPage.getByText(`@${creatorUsername}`)).toHaveCount(0);

  await adminContext.close();
});
