import { usdArsRate } from "./fx";

// Redondea a un número prolijo (múltiplo de 50 ARS) para que el precio
// percibido no muestre centavos ni cifras raras por la cotización del día.
export function roundToNiceAmount(value: number) {
  return Math.max(50, Math.round(value / 50) * 50);
}

export async function copitaAmountArs(priceUsd: number, quantity: number) {
  const rate = await usdArsRate();
  const raw = priceUsd * quantity * rate;
  return { amount: roundToNiceAmount(raw), fxRateUsed: rate };
}

export async function subscriptionAmountArs(priceUsd: number) {
  const rate = await usdArsRate();
  const raw = priceUsd * rate;
  return { amount: roundToNiceAmount(raw), fxRateUsed: rate };
}
