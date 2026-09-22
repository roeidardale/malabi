/**
 * Normalizes an Israeli mobile number to E.164 (+9725XXXXXXXX). Accepts
 * "05XXXXXXXX", "+9725XXXXXXXX", or "9725XXXXXXXX" with any spaces/dashes;
 * returns null for anything else so callers can reject bad input uniformly.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.trim().replace(/[\s-]/g, "");

  if (/^05\d{8}$/.test(digits)) {
    return `+972${digits.slice(1)}`;
  }
  if (/^\+9725\d{8}$/.test(digits)) {
    return digits;
  }
  if (/^9725\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  return null;
}
