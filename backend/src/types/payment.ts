export type PaymentType = "online" | "presential";

export type PaymentStatus = "not_required" | "pending" | "approved" | "rejected" | "cancelled" | "pending_local";

export type ProviderPaymentSettings = {
  providerId: string;
  organizationId: string;
  commissionRateBps: number;
  onlineDiscountBps: number;
  absorbsProcessingFee: boolean;
  mercadoPagoConnected: boolean;
  mercadoPagoUserId?: string | null;
  mercadoPagoAccessToken?: string | null;
  mercadoPagoRefreshToken?: string | null;
  mercadoPagoTokenExpiresAt?: string | null;
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

export type MercadoPagoOAuthConnectUrl = {
  providerId: string;
  authorizationUrl: string;
};

export type MercadoPagoWebhookInput = {
  bookingId?: string;
  eventType?: string;
  paymentId?: string;
  payload: unknown;
  signature?: string;
  requestId?: string;
};
