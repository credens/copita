// Cotización USD -> ARS para convertir el precio de referencia de una copita
// (fijado en USD) al monto real que se cobra en Mercado Pago Argentina (ARS).
// Se cachea en memoria por poco tiempo para no golpear la API externa en cada
// checkout, y cae a un valor fijo por env si la API no responde.

let cached: { rate: number; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60_000;

async function fetchOfficialRate(): Promise<number | null> {
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/oficial", { next: { revalidate: 1800 } });
    if (!response.ok) return null;
    const data = (await response.json()) as { venta?: number };
    return typeof data.venta === "number" && data.venta > 0 ? data.venta : null;
  } catch {
    return null;
  }
}

export async function usdArsRate(): Promise<number> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rate;
  const fallback = Number(process.env.USD_ARS_FALLBACK_RATE ?? "1000");
  const rate = (await fetchOfficialRate()) ?? fallback;
  cached = { rate, fetchedAt: Date.now() };
  return rate;
}
