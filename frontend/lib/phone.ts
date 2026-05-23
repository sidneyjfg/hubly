const brazilianWhatsAppPhonePattern = /^55[1-9]{2}9\d{8}$/;

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

export function getBrazilianWhatsAppDigits(value: string): string {
  const digits = normalizePhoneDigits(value);
  const nationalDigits = digits.startsWith("55") ? digits.slice(2) : digits;

  return `55${nationalDigits}`.slice(0, 13);
}

export function isValidBrazilianWhatsAppPhone(value: string): boolean {
  return brazilianWhatsAppPhonePattern.test(getBrazilianWhatsAppDigits(value));
}

export function formatBrazilianWhatsAppPhone(value: string): string {
  const digits = getBrazilianWhatsAppDigits(value);
  const ddd = digits.slice(2, 4);
  const firstPart = digits.slice(4, 9);
  const secondPart = digits.slice(9, 13);

  let formatted = "+55";

  if (ddd) {
    formatted += ` (${ddd}`;
  }

  if (ddd.length === 2) {
    formatted += ")";
  }

  if (firstPart) {
    formatted += ` ${firstPart}`;
  }

  if (secondPart) {
    formatted += `-${secondPart}`;
  }

  return formatted;
}
