import Stripe from "stripe";
import type { Stripe as StripeClient } from "stripe/cjs/stripe.core";
import type { Account } from "stripe/cjs/resources/Accounts";
import type { Balance } from "stripe/cjs/resources/Balance";
import type { Event } from "stripe/cjs/resources/Events";
import type { PaymentIntent } from "stripe/cjs/resources/PaymentIntents";
import type { Payout } from "stripe/cjs/resources/Payouts";
import type { Subscription } from "stripe/cjs/resources/Subscriptions";

import { AppError } from "../utils/app-error";
import { env } from "../utils/env";

type StripeAccountSnapshot = {
  id: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  disabledReason?: string | null;
  status: "pending" | "verified" | "restricted";
};

const assertStripeConfigured = (): void => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("payments.stripe_not_configured", "O provedor de pagamentos não está configurado.", 500);
  }
};

const normalizeAccountStatus = (account: Account): StripeAccountSnapshot["status"] => {
  const currentlyDue = account.requirements?.currently_due ?? [];
  const pastDue = account.requirements?.past_due ?? [];
  const disabledReason = account.requirements?.disabled_reason;

  if (disabledReason || pastDue.length > 0 || (!account.charges_enabled && account.details_submitted)) {
    return "restricted";
  }

  if (account.charges_enabled && account.payouts_enabled && account.details_submitted && currentlyDue.length === 0) {
    return "verified";
  }

  return "pending";
};

const toAccountSnapshot = (account: Account): StripeAccountSnapshot => ({
  id: account.id,
  chargesEnabled: account.charges_enabled,
  payoutsEnabled: account.payouts_enabled,
  detailsSubmitted: account.details_submitted,
  currentlyDue: account.requirements?.currently_due ?? [],
  eventuallyDue: account.requirements?.eventually_due ?? [],
  pastDue: account.requirements?.past_due ?? [],
  disabledReason: account.requirements?.disabled_reason ?? null,
  status: normalizeAccountStatus(account),
});

const isStripeConnectNotEnabledError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const stripeError = error as { message?: string; rawType?: string; statusCode?: number };
  return stripeError.rawType === "invalid_request_error"
    && stripeError.statusCode === 400
    && Boolean(stripeError.message?.includes("signed up for Connect"));
};

export class StripeService {
  private stripe: StripeClient | null = null;

  private getClient(): StripeClient {
    assertStripeConfigured();
    this.stripe ??= new Stripe(env.STRIPE_SECRET_KEY);
    return this.stripe;
  }

  public async createExpressAccount(input: {
    organizationId: string;
    providerId?: string;
    accountName: string;
  }): Promise<StripeAccountSnapshot> {
    let account: Account;

    try {
      account = await this.getClient().accounts.create({
        type: "express",
        country: "BR",
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: input.accountName,
        },
        metadata: {
          organizationId: input.organizationId,
          ...(input.providerId ? { providerId: input.providerId } : {}),
        },
      });
    } catch (error) {
      if (isStripeConnectNotEnabledError(error)) {
        throw new AppError(
          "payments.stripe_connect_not_enabled",
          "A plataforma ainda não habilitou o processamento de pagamentos para contas conectadas. Ative esse recurso no painel do provedor antes de iniciar a verificação de identidade.",
          409,
        );
      }

      throw error;
    }

    return toAccountSnapshot(account);
  }

  public toAccountSnapshot(account: Account): StripeAccountSnapshot {
    return toAccountSnapshot(account);
  }

  public async retrieveAccount(accountId: string): Promise<StripeAccountSnapshot> {
    return toAccountSnapshot(await this.getClient().accounts.retrieve(accountId));
  }

  public async createAccountOnboardingLink(input: {
    stripeAccountId: string;
    returnUrl: string;
    refreshUrl: string;
  }): Promise<string> {
    const link = await this.getClient().accountLinks.create({
      account: input.stripeAccountId,
      type: "account_onboarding",
      return_url: input.returnUrl,
      refresh_url: input.refreshUrl,
    });

    return link.url;
  }

  public async createConnectedAccountPaymentIntent(input: {
    amountCents: number;
    stripeAccountId: string;
    bookingId: string;
    organizationId: string;
    providerId: string;
    customerEmail?: string | null;
    serviceName?: string | null;
    idempotencyKey: string;
  }): Promise<PaymentIntent> {
    return this.getClient().paymentIntents.create(
      {
        amount: input.amountCents,
        currency: "brl",
        payment_method_types: ["card"],
        description: input.serviceName ?? "Agendamento Hubly",
        metadata: {
          bookingId: input.bookingId,
          organizationId: input.organizationId,
          providerId: input.providerId,
        },
        ...(input.customerEmail ? { receipt_email: input.customerEmail } : {}),
      },
      {
        idempotencyKey: input.idempotencyKey,
        stripeAccount: input.stripeAccountId,
      },
    );
  }

  public async createSubscriptionCheckoutSession(input: {
    organizationId: string;
    billingPlanId: string;
    planCode: string;
    priceId: string;
    customerId?: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; url: string }> {
    const session = await this.getClient().checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      line_items: [
        {
          price: input.priceId,
          quantity: 1,
        },
      ],
      ...(input.customerId ? { customer: input.customerId } : {}),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.organizationId,
      metadata: {
        kind: "hubly_subscription",
        organizationId: input.organizationId,
        billingPlanId: input.billingPlanId,
        planCode: input.planCode,
      },
      subscription_data: {
        metadata: {
          kind: "hubly_subscription",
          organizationId: input.organizationId,
          billingPlanId: input.billingPlanId,
          planCode: input.planCode,
        },
      },
    });

    if (!session.url) {
      throw new AppError("billing.checkout_url_missing", "Checkout de assinatura não retornou uma URL válida.", 502);
    }

    return {
      id: session.id,
      url: session.url,
    };
  }

  public async createBillingPortalSession(input: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const session = await this.getClient().billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });

    return {
      url: session.url,
    };
  }

  public async scheduleSubscriptionCancellation(stripeSubscriptionId: string): Promise<Subscription> {
    return this.getClient().subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  public async cancelSubscriptionImmediately(stripeSubscriptionId: string): Promise<Subscription> {
    return this.getClient().subscriptions.cancel(stripeSubscriptionId, {
      invoice_now: false,
      prorate: false,
    });
  }

  public async retrieveBalance(stripeAccountId: string): Promise<Balance> {
    return this.getClient().balance.retrieve({}, {
      stripeAccount: stripeAccountId,
    });
  }

  public async createPayout(input: {
    stripeAccountId: string;
    amountCents: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<Payout> {
    const account = await this.retrieveAccount(input.stripeAccountId);
    if (!account.payoutsEnabled || !account.detailsSubmitted) {
      throw new AppError("payments.stripe_payouts_not_enabled", "A conta de pagamentos ainda não está pronta para saques.", 409);
    }

    const balance = await this.retrieveBalance(input.stripeAccountId);
    const available = balance.available.find((item) => item.currency === input.currency);
    if (!available || available.amount < input.amountCents) {
      throw new AppError("payments.insufficient_balance", "Saldo disponível insuficiente para solicitar saque.", 409);
    }

    return this.getClient().payouts.create(
      {
        amount: input.amountCents,
        currency: input.currency,
      },
      {
        stripeAccount: input.stripeAccountId,
        idempotencyKey: input.idempotencyKey,
      },
    );
  }

  public constructWebhookEvent(rawBody: Buffer, signature: string | undefined): Event {
    if (!signature) {
      throw new AppError("payments.invalid_webhook_signature", "Assinatura da confirmação de pagamento ausente.", 401);
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError("payments.stripe_webhook_not_configured", "A confirmação automática de pagamentos não está configurada.", 500);
    }

    try {
      return this.getClient().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new AppError("payments.invalid_webhook_signature", "Assinatura da confirmação de pagamento inválida.", 401);
    }
  }
}
