export type BillingPlanCode = "free" | "pro" | "premium";

export type BillingPlan = {
  id: string;
  code: BillingPlanCode;
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  interval: string;
  stripeMode: "test" | "live";
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  isDefault: boolean;
};

export type OrganizationSubscription = {
  id: string;
  organizationId: string;
  billingPlanId: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused" | "incomplete" | "incomplete_expired";
  stripeMode: "test" | "live";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePriceId: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: BillingPlan;
};

export type SubscriptionCheckout = {
  checkoutUrl: string;
};

export type SubscriptionCustomerPortal = {
  portalUrl: string;
};
