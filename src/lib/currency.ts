export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  LKR: 300.0,
  AUD: 1.52,
  CAD: 1.37,
  INR: 83.5,
};

export function convertCurrency(
  amount: number | string | null | undefined,
  from: string = "USD",
  to: string = "USD"
): number {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (isNaN(value)) return 0;
  if (from === to) return value;

  const fromRate = EXCHANGE_RATES[from.toUpperCase()] || 1.0;
  const toRate = EXCHANGE_RATES[to.toUpperCase()] || 1.0;

  // Convert to USD first (base currency), then to target currency
  const amountInUSD = value / fromRate;
  return amountInUSD * toRate;
}
