import { sellerAccessToken } from "@/lib/mercadopago";

type Creator = { id: string; name: string; username: string; mpAccessToken: string | null; mpRefreshToken: string | null; mpTokenExpiresAt: Date | null };

// La API de Preapproval de Mercado Pago no admite `marketplace_fee` /
// `application_fee` como sí lo hace Checkout Pro: no hay forma de que MP
// reparta un cobro recurrente entre el creador y Copita en el mismo pago.
// Por eso la suscripción se autoriza y cobra 100% a nombre del creador; la
// comisión de Copita queda registrada como Commission PENDING para liquidar
// aparte (ver README).
export async function createPreapproval(params: { creator: Creator; subscriptionId: string; supporterEmail: string; amountArs: number; appUrl: string }) {
  const accessToken = await sellerAccessToken(params.creator);
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      reason: `Club de Copita · ${params.creator.name}`,
      external_reference: params.subscriptionId,
      payer_email: params.supporterEmail,
      back_url: `${params.appUrl}/${params.creator.username}/gracias?tipo=suscripcion`,
      auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: params.amountArs, currency_id: "ARS" },
      status: "pending",
    }),
  });
  const data = (await response.json()) as { id?: string; init_point?: string; sandbox_init_point?: string; message?: string };
  if (!response.ok || !data.id) throw new Error(data.message ?? "No se pudo crear la suscripción en Mercado Pago");
  return { preapprovalId: data.id, checkoutUrl: process.env.MP_USE_SANDBOX === "true" ? data.sandbox_init_point ?? data.init_point : data.init_point };
}

export async function cancelPreapproval(creator: Creator, preapprovalId: string) {
  const accessToken = await sellerAccessToken(creator);
  const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: "PUT",
    headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!response.ok) throw new Error("No se pudo cancelar la suscripción en Mercado Pago");
}

export async function fetchPreapproval(creator: Creator, preapprovalId: string) {
  const accessToken = await sellerAccessToken(creator);
  const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("No se pudo consultar la suscripción en Mercado Pago");
  return (await response.json()) as { id: string; status: string; next_payment_date?: string };
}
