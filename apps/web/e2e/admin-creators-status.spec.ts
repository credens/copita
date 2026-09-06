import { test, expect } from "@playwright/test";

test("un admin ve el estado de Mercado Pago de un creador recién registrado como no conectado", async ({ page, context }) => {
  const suffix = Date.now();
  const creatorUsername = `sinmp${suffix}`;
  const adminEmail = "admin@copita.ar"; // ver PLATFORM_ADMIN_EMAILS en .env.test

  await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${(suffix + 21) % 255}` });

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Creador Sin MP");
  await page.getByLabel(/Usuario/).fill(creatorUsername);
  await page.getByLabel("Email").fill(`${creatorUsername}@example.com`);
  await page.getByLabel("Contraseña").fill("password1234");
  await page.getByRole("button", { name: "Crear mi perfil" }).click();
  await expect(page).toHaveURL(/\/panel$/);

  const adminContext = await context.browser()!.newContext();
  const adminIp = `203.0.113.${(suffix + 22) % 255}`;
  const registerAdmin = await adminContext.request.post("/api/auth/register", {
    headers: { "x-forwarded-for": adminIp },
    data: { name: "Admin E2E", username: `admine2ecre${suffix}`, email: adminEmail, password: "password1234" },
  });
  if (!registerAdmin.ok()) {
    const login = await adminContext.request.post("/api/auth/login", { headers: { "x-forwarded-for": adminIp }, data: { email: adminEmail, password: "password1234" } });
    expect(login.ok()).toBe(true);
  }
  const adminPage = await adminContext.newPage();
  await adminPage.setExtraHTTPHeaders({ "x-forwarded-for": adminIp });

  await adminPage.goto("/admin");
  await adminPage.getByRole("link", { name: "Estado de Mercado Pago" }).click();
  await expect(adminPage).toHaveURL(/\/admin\/creadores/);

  const row = adminPage.getByRole("row", { name: new RegExp(creatorUsername) });
  await expect(row).toBeVisible();
  await expect(row.getByText("No conectado a Mercado Pago")).toBeVisible();

  await adminContext.close();
});
