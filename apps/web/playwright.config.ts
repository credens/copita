import { defineConfig, devices } from "@playwright/test";

// Se invoca siempre vía `npm run test:e2e` desde la raíz del monorepo, que ya
// sourceó `.env.test` (DATABASE_URL apuntando a copita_test) antes de llamar
// a Playwright — por eso `webServer` no pisa el entorno, solo lo hereda.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next dev apps/web -p 3100",
    cwd: process.cwd(),
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
