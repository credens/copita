export const PLATFORM_FEE_RATE_BPS = 500; // 5% por defecto

type FeeConfig = { feeType?: string; feeValue?: unknown; feeMin?: unknown; feeMax?: unknown };

export function platformFeeAmount(billedAmount: number, config?: FeeConfig) {
  if (!Number.isFinite(billedAmount) || billedAmount <= 0) return 0;
  const value = config?.feeValue == null ? 5 : Number(config.feeValue);
  let fee = config?.feeType === "fixed" ? value : (billedAmount * value) / 100;
  if (config?.feeMin != null) fee = Math.max(fee, Number(config.feeMin));
  if (config?.feeMax != null) fee = Math.min(fee, Number(config.feeMax));
  return Math.round(Math.min(fee, billedAmount) * 100) / 100;
}

export function feeRateBps(config?: FeeConfig) {
  return config?.feeType === "percent" || !config?.feeType ? Math.round(Number(config?.feeValue ?? 5) * 100) : 0;
}
