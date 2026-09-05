// Derecho de arrepentimiento (Ley 24.240 art. 34, compras a distancia): 10
// días corridos desde el pago. Es el piso general de la ley — si Disposición
// 954/2025 fija un plazo distinto para micro-mecenazgo, ajustar acá.
export const WITHDRAWAL_WINDOW_DAYS = 10;

export function withdrawalDeadline(paidAt: Date) {
  return new Date(paidAt.getTime() + WITHDRAWAL_WINDOW_DAYS * 24 * 60 * 60_000);
}

export function isWithinWithdrawalWindow(paidAt: Date, now = new Date()) {
  return now.getTime() <= withdrawalDeadline(paidAt).getTime();
}
