export type PaymentType = "online" | "presential";

export type PaymentStatus = "not_required" | "pending" | "confirmed" | "rejected" | "cancelled" | "pending_local";

export type ProviderPaymentSettings = {
  providerId: string;
  organizationId: string;
  commissionRateBps: number;
  onlineDiscountBps: number;
  absorbsProcessingFee: boolean;
  stripeAccountId?: string | null;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  stripeCurrentlyDue: string[];
  stripeEventuallyDue: string[];
  stripePastDue: string[];
  stripeDisabledReason?: string | null;
  stripeAccountStatus: StripeAccountStatus;
};

export type OrganizationPaymentSettings = Omit<ProviderPaymentSettings, "providerId">;

export type PaymentBreakdown = {
  paymentType: PaymentType;
  originalAmountCents: number;
  discountedAmountCents: number;
  onlineDiscountCents: number;
  platformCommissionRateBps: number;
  platformCommissionCents: number;
  providerNetAmountCents: number;
  paymentStatus: PaymentStatus;
};

export type StripeConnectAccount = {
  providerId?: string;
  organizationId?: string;
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export type StripeOnboardingLink = {
  providerId?: string;
  organizationId?: string;
  onboardingUrl: string;
};

export type StripeBalance = {
  providerId?: string;
  organizationId?: string;
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
};

export type StripePayoutResult = {
  providerId?: string;
  organizationId?: string;
  payoutId: string;
  amount: number;
  currency: string;
  status: string;
};

export type StripeAccountStatus = "pending" | "verified" | "restricted";

export type StripeAccountStatusResponse = {
  providerId?: string;
  organizationId?: string;
  status: StripeAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason?: string | null;
  canReceivePayments: boolean;
  canRequestPayouts: boolean;
  blockedReasons: string[];
};

export type FinancialHistoryItem = {
  amountCents: number;
  currency: string;
  type: string;
  status: string;
  createdAt: string;
  failureReason?: string | null;
  metadata?: unknown | null;
};
