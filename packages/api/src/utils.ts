// generate a valid 27-digit QR reference from an invoice id
// uses modulo-10 recursive check digit (ISO 7064 variant used by SIX)
export function buildQrReference(invoiceId: number): string {
  const base = String(invoiceId).padStart(26, "0");
  const table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
  let carry = 0;
  for (const ch of base) {
    carry = table[(carry + parseInt(ch, 10)) % 10]!;
  }
  const checkDigit = (10 - carry) % 10;
  return `${base}${checkDigit}`;
}
