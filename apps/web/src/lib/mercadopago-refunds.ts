import { sellerAccessToken } from "@/lib/mercadopago";

type Creator = { id: string; mpAccessToken: string | null; mpRefreshToken: string | null; mpTokenExpiresAt: Date | null };

// Reembolso total de un pago aprobado (botón de arrepentimiento). Se ejecuta
// con el access_token del creador porque la plata de una copita nunca pasa
// por una cuenta de Copita — el reembolso sale directo de la cuenta del
// creador, igual que entró.
export async function refundPayment(creator: Creator, providerPaymentId: string) {
  const accessToken = await sellerAccessToken(creator);
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(providerPaymentId)}/refunds`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({}),
  });
  const data = (await response.json()) as { id?: number; status?: string; message?: string };
  if (!response.ok) throw new Error(data.message ?? "Mercado Pago no pudo procesar el reembolso");
  return data;
}
