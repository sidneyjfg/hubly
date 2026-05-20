import type { PaymentBreakdown, PaymentType, ProviderPaymentSettings } from "../types/payment";

const clampBasisPoints = (value: number): number => Math.min(10000, Math.max(0, Math.trunc(value)));

const calculateBasisPointsAmount = (amountCents: number, basisPoints: number): number =>
  Math.round((amountCents * clampBasisPoints(basisPoints)) / 10000);

const PLATFORM_COMMISSION_BPS = 0;

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
    const platformCommissionCents = calculateBasisPointsAmount(discountedAmountCents, PLATFORM_COMMISSION_BPS);

    return {
      paymentType,
      originalAmountCents: safeOriginalAmountCents,
      discountedAmountCents,
      onlineDiscountCents,
      platformCommissionRateBps: PLATFORM_COMMISSION_BPS,
      platformCommissionCents,
      providerNetAmountCents: discountedAmountCents,
      paymentStatus: paymentType === "online" ? "pending" : "pending_local",
    };
  }
}
