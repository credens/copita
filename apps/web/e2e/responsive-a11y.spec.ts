import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// No hay dispositivos reales para probar esto (solo curl de escritorio hasta
// ahora) — el sustituto automatizado más cercano: un viewport mobile real
// (iPhone 13, 390x844) sin overflow horizontal, y un scan de accesibilidad
// (axe-core) sobre las páginas públicas más importantes. No reemplaza probar
// en un dispositivo de verdad, pero cubre lo que sí se puede verificar solo.
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const PUBLIC_PAGES = ["/", "/explorar", "/demo", "/registro", "/login"];

async function hasHorizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

test.describe("responsive (viewport mobile 390x844)", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const path of PUBLIC_PAGES) {
    test(`${path} no tiene scroll horizontal en mobile`, async ({ page }) => {
      await page.goto(path);
      expect(await hasHorizontalOverflow(page), `${path} desborda el ancho del viewport mobile`).toBe(false);
    });
  }

  test("el formulario de copita en /demo es usable en mobile (sin overflow, botón visible)", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("button", { name: "Pagar con Mercado Pago" })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("el buscador de /explorar es usable en mobile", async ({ page }) => {
    await page.goto("/explorar");
    const search = page.getByRole("searchbox", { name: "Buscar creadores" });
    await expect(search).toBeVisible();
    await search.fill("test");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/\?q=test/);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});

test.describe("accesibilidad (axe-core, sin violaciones serias/críticas)", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} no tiene violaciones serias o críticas de accesibilidad`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      const relevant = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(relevant, JSON.stringify(relevant, null, 2)).toEqual([]);
    });
  }
});
