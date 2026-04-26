import type { PaymentBreakdown, PaymentType, ProviderPaymentSettings } from "../types/payment";

const clampBasisPoints = (value: number): number => Math.min(10000, Math.max(0, Math.trunc(value)));

const calculateBasisPointsAmount = (amountCents: number, basisPoints: number): number =>
  Math.round((amountCents * clampBasisPoints(basisPoints)) / 10000);

export class PaymentCalculatorService {
  public calculate(
    paymentType: PaymentType,
    originalAmountCents: number,
    settings: Pick<ProviderPaymentSettings, "commissionRateBps" | "onlineDiscountBps">,
  ): PaymentBreakdown {
    const safeOriginalAmountCents = Math.max(0, Math.trunc(originalAmountCents));
    const onlineDiscountCents = paymentType === "online"
      ? calculateBasisPointsAmount(safeOriginalAmountCents, settings.onlineDiscountBps)
      : 0;
    const discountedAmountCents = Math.max(0, safeOriginalAmountCents - onlineDiscountCents);
    const platformCommissionCents = calculateBasisPointsAmount(discountedAmountCents, settings.commissionRateBps);

    return {
      paymentType,
      originalAmountCents: safeOriginalAmountCents,
      discountedAmountCents,
      onlineDiscountCents,
      platformCommissionRateBps: clampBasisPoints(settings.commissionRateBps),
      platformCommissionCents,
      providerNetAmountCents: Math.max(0, discountedAmountCents - platformCommissionCents),
      paymentStatus: paymentType === "online" ? "pending" : "pending_local",
    };
  }
}
