import { z } from "zod";

const brazilianWhatsAppPhonePattern = /^55[1-9]{2}9\d{8}$/;

export const normalizeDigits = (value: string): string => value.replace(/\D+/g, "");

export const normalizeBrazilianWhatsAppPhone = (value: string): string | null => {
  const digits = normalizeDigits(value);

  if (!brazilianWhatsAppPhonePattern.test(digits)) {
    return null;
  }

  return digits;
};

export const brazilianWhatsAppPhoneSchema = z.string().transform((value, context) => {
  const normalizedPhone = normalizeBrazilianWhatsAppPhone(value);

  if (!normalizedPhone) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe um WhatsApp brasileiro com DDI, DDD e 9 digitos. Exemplo: +55 (11) 90000-0000.",
    });

    return z.NEVER;
  }

  return normalizedPhone;
});
