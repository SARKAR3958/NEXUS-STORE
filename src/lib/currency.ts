export const CURRENCY_SYMBOL = "Rs.";

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "Rs. 0";
  }
  const num = Number(amount);
  // Format with commas and max 2 decimal places
  const formattedNum = num.toLocaleString('en-PK', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  });
  return `Rs. ${formattedNum}`;
}
