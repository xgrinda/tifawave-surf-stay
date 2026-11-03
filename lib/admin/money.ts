/** Form amounts use major currency units; persisted amounts use integer cents. */
export function amountToMinorString(value: string): string {
  const normalized = value.trim();
  return /^\d{1,6}(\.\d{1,2})?$/.test(normalized)
    ? String(Math.round(Number(normalized) * 100))
    : "NaN";
}
