import { randomUUID } from "node:crypto";
import type { Account } from "stripe/cjs/resources/Accounts";
import type { Balance } from "stripe/cjs/resources/Balance";
import type { Session } from "stripe/cjs/resources/Checkout/Sessions";
import type { Event } from "stripe/cjs/resources/Events";
import type { Invoice } from "stripe/cjs/resources/Invoices";
import type { PaymentIntent } from "stripe/cjs/resources/PaymentIntents";
import type { Payout } from "stripe/cjs/resources/Payouts";
import type { Subscription } from "stripe/cjs/resources/Subscriptions";
import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";

import { AuditRepository } from "../repositories/audit.repository";
import { BookingsRepository } from "../repositories/bookings.repository";
import { FinancialLedgerRepository } from "../repositories/financial-ledger.repository";
import { OrganizationPaymentSettingsRepository } from "../repositories/organization-payment-settings.repository";
import { PaymentTransactionsRepository } from "../repositories/payment-transactions.repository";
import { ProviderPayoutsRepository } from "../repositories/provider-payouts.repository";
import { ProviderPaymentSettingsRepository } from "../repositories/provider-payment-settings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { StripeWebhookEventsRepository } from "../repositories/stripe-webhook-events.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Booking, BookingPaymentStatus } from "../types/booking";
import type {
  FinancialHistoryItem,
  PaymentBreakdown,
  PaymentType,
  StripeAccountStatus,
  StripeAccountStatusResponse,
  StripeBalance,
  StripeConnectAccount,
  StripeOnboardingLink,
  StripePayoutResult,
} from "../types/payment";
import type { Provider } from "../types/provider";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";
import { NotificationsService } from "./notifications.service";
import { PaymentCalculatorService } from "./payment-calculator.service";
import { StripeService } from "./stripe.service";
import { BillingService } from "./billing.service";

const PLATFORM_COMMISSION_BPS = 0;
const MIN_PAYOUT_CENTS = 500;
const MAX_PAYOUT_CENTS = 5_000_000;

const paymentSettingsSchema = z.object({
  onlineDiscountBps: z.number().int().min(0).max(10000).optional(),
  absorbsProcessingFee: z.boolean().optional(),
});

const onboardingLinkSchema = z.object({
  returnUrl: z.string().url().optional(),
  refreshUrl: z.string().url().optional(),
});

const payoutSchema = z.object({
  amountCents: z.number().int().min(MIN_PAYOUT_CENTS).max(MAX_PAYOUT_CENTS),
  currency: z.string().trim().length(3).default("brl"),
  idempotencyKey: z.string().trim().min(12).max(160).optional(),
});

const mapPaymentIntentStatus = (status: PaymentIntent.Status | undefined): BookingPaymentStatus => {
  if (status === "succeeded") return "approved";
  if (status === "canceled") return "cancelled";
  if (status === "requires_capture") return "rejected";
  return "pending";
};

const getLatestChargeId = (paymentIntent: PaymentIntent): string | null => {
  const charge = paymentIntent.latest_charge;
  return !charge ? null : typeof charge === "string" ? charge : charge.id;
};

const mapStripeBalanceAmount = (amount: Balance.Available): { amount: number; currency: string } => ({
  amount: amount.amount,
  currency: amount.currency,
});

const toHistoryItem = (item: {
  amountCents: number;
  currency: string;
  type: string;
  status: string;
  createdAt: Date;
  failureReason: string | null;
  metadata?: unknown | null;
}): FinancialHistoryItem => ({
  amountCents: item.amountCents,
  currency: item.currency,
  type: item.type,
  status: item.status,
  createdAt: item.createdAt.toISOString(),
  failureReason: item.failureReason,
  metadata: item.metadata ?? null,
});

export class PaymentsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly organizationPaymentSettingsRepository: OrganizationPaymentSettingsRepository,
    private readonly providerPaymentSettingsRepository: ProviderPaymentSettingsRepository,
    private readonly providersRepository: ProvidersRepository,
    private readonly serviceOfferingsRepository: ServiceOfferingsRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly paymentTransactionsRepository: PaymentTransactionsRepository,
    private readonly auditRepository: AuditRepository,
    private readonly notificationsService: NotificationsService,
    private readonly paymentCalculatorService: PaymentCalculatorService,
    private readonly stripeService: StripeService,
    private readonly webhookEventsRepository: StripeWebhookEventsRepository,
    private readonly ledgerRepository: FinancialLedgerRepository,
    private readonly providerPayoutsRepository: ProviderPayoutsRepository,
    private readonly billingService = new BillingService(dataSource),
  ) {}

  public async getOrganizationSettings(user: AuthenticatedRequestUser) {
    return this.organizationPaymentSettingsRepository.getOrCreateDefault(user.organizationId);
  }

  public async updateOrganizationSettings(user: AuthenticatedRequestUser, input: unknown) {
    const data = paymentSettingsSchema.parse(input);
    const updateInput = {
      ...(data.onlineDiscountBps === undefined ? {} : { onlineDiscountBps: data.onlineDiscountBps }),
      ...(data.absorbsProcessingFee === undefined ? {} : { absorbsProcessingFee: data.absorbsProcessingFee }),
    };

    return this.organizationPaymentSettingsRepository.updateInOrganization(user.organizationId, updateInput);
  }

  public async getProviderSettings(user: AuthenticatedRequestUser, providerId: string) {
    await this.ensureFinancialAccess(user, providerId);
    return this.providerPaymentSettingsRepository.getOrCreateDefault(user.organizationId, providerId);
  }

  public async updateProviderSettings(user: AuthenticatedRequestUser, providerId: string, input: unknown) {
    await this.ensureFinancialAccess(user, providerId);
    const data = paymentSettingsSchema.parse(input);
    return this.providerPaymentSettingsRepository.updateInOrganization(user.organizationId, providerId, {
      ...(data.onlineDiscountBps === undefined ? {} : { onlineDiscountBps: data.onlineDiscountBps }),
      ...(data.absorbsProcessingFee === undefined ? {} : { absorbsProcessingFee: data.absorbsProcessingFee }),
    });
  }

  public async createStripeExpressAccount(
    user: AuthenticatedRequestUser,
    providerId: string,
  ): Promise<StripeConnectAccount> {
    this.ensureAdministrator(user);
    const provider = await this.getProvider(user.organizationId, providerId);
    const account = provider.stripeAccountId
      ? await this.stripeService.retrieveAccount(provider.stripeAccountId)
      : await this.stripeService.createExpressAccount({
        organizationId: user.organizationId,
        providerId,
        accountName: provider.fullName,
      });

    if (!provider.stripeAccountId) {
      await this.providersRepository.saveStripeAccountId(user.organizationId, providerId, account.id);
    }

    await this.saveStripeAccountSnapshot(user.organizationId, providerId, account);
    await this.auditRepository.create({
      organizationId: user.organizationId,
      actorId: user.id,
      action: "provider_payment.stripe_account_created",
      targetType: "provider",
      targetId: providerId,
    });

    return {
      providerId,
      stripeAccountId: account.id,
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
    };
  }

  public async createOrganizationStripeExpressAccount(user: AuthenticatedRequestUser): Promise<StripeConnectAccount> {
    this.ensureAdministrator(user);
    const settings = await this.organizationPaymentSettingsRepository.getOrCreateDefault(user.organizationId);
    const account = settings.stripeAccountId
      ? await this.stripeService.retrieveAccount(settings.stripeAccountId)
      : await this.stripeService.createExpressAccount({
        organizationId: user.organizationId,
        accountName: `Hubly ${user.organizationId}`,
      });

    if (!settings.stripeAccountId) {
      await this.organizationPaymentSettingsRepository.saveStripeAccountId(user.organizationId, account.id);
    }

    await this.saveOrganizationStripeAccountSnapshot(user.organizationId, account);
    await this.auditRepository.create({
      organizationId: user.organizationId,
      actorId: user.id,
      action: "organization_payment.stripe_account_created",
      targetType: "organization",
      targetId: user.organizationId,
    });

    return {
      organizationId: user.organizationId,
      stripeAccountId: account.id,
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
    };
  }

  public async createStripeOnboardingLink(
    user: AuthenticatedRequestUser,
    providerId: string,
    input: unknown,
  ): Promise<StripeOnboardingLink> {
    await this.ensureFinancialAccess(user, providerId);
    const data = onboardingLinkSchema.parse(input ?? {});
    const account = user.role === "administrator"
      ? await this.createStripeExpressAccount(user, providerId)
      : await this.getExistingStripeAccount(user, providerId);
    const onboardingUrl = await this.stripeService.createAccountOnboardingLink({
      stripeAccountId: account.stripeAccountId,
      returnUrl: data.returnUrl ?? env.STRIPE_CONNECT_RETURN_URL,
      refreshUrl: data.refreshUrl ?? env.STRIPE_CONNECT_REFRESH_URL,
    });

    return { providerId, onboardingUrl };
  }

  public async createOrganizationStripeOnboardingLink(
    user: AuthenticatedRequestUser,
    input: unknown,
  ): Promise<StripeOnboardingLink> {
    this.ensureAdministrator(user);
    const data = onboardingLinkSchema.parse(input ?? {});
    const account = await this.createOrganizationStripeExpressAccount(user);
    const onboardingUrl = await this.stripeService.createAccountOnboardingLink({
      stripeAccountId: account.stripeAccountId,
      returnUrl: data.returnUrl ?? env.STRIPE_CONNECT_RETURN_URL,
      refreshUrl: data.refreshUrl ?? env.STRIPE_CONNECT_REFRESH_URL,
    });

    return { organizationId: user.organizationId, onboardingUrl };
  }

  public async getStripeBalance(user: AuthenticatedRequestUser, providerId: string): Promise<StripeBalance> {
    const provider = await this.ensureFinancialAccess(user, providerId);
    const stripeAccountId = this.requireStripeAccount(provider);
    const balance = await this.stripeService.retrieveBalance(stripeAccountId);

    return {
      providerId,
      available: balance.available.map(mapStripeBalanceAmount),
      pending: balance.pending.map(mapStripeBalanceAmount),
    };
  }

  public async getOrganizationStripeBalance(user: AuthenticatedRequestUser): Promise<StripeBalance> {
    this.ensureAdministrator(user);
    const stripeAccountId = await this.requireOrganizationStripeAccount(user.organizationId);
    const balance = await this.stripeService.retrieveBalance(stripeAccountId);

    return {
      organizationId: user.organizationId,
      available: balance.available.map(mapStripeBalanceAmount),
      pending: balance.pending.map(mapStripeBalanceAmount),
    };
  }

  public async getStripeAccountStatus(
    user: AuthenticatedRequestUser,
    providerId: string,
  ): Promise<StripeAccountStatusResponse> {
    const provider = await this.ensureFinancialAccess(user, providerId);
    const stripeAccountId = this.requireStripeAccount(provider);
    const account = await this.stripeService.retrieveAccount(stripeAccountId);
    await this.saveStripeAccountSnapshot(user.organizationId, providerId, account);
    return this.buildAccountStatusResponse({ providerId }, account);
  }

  public async getOrganizationStripeAccountStatus(user: AuthenticatedRequestUser): Promise<StripeAccountStatusResponse> {
    this.ensureAdministrator(user);
    const stripeAccountId = await this.requireOrganizationStripeAccount(user.organizationId);
    const account = await this.stripeService.retrieveAccount(stripeAccountId);
    await this.saveOrganizationStripeAccountSnapshot(user.organizationId, account);
    return this.buildAccountStatusResponse({ organizationId: user.organizationId }, account);
  }

  public async getTransactionHistory(user: AuthenticatedRequestUser, providerId: string): Promise<{ items: FinancialHistoryItem[] }> {
    await this.ensureFinancialAccess(user, providerId);
    const items = await this.ledgerRepository.findByProvider(user.organizationId, providerId, {
      types: ["payment_created", "payment_succeeded", "payment_failed"],
    });
    return { items: items.map(toHistoryItem) };
  }

  public async getOrganizationTransactionHistory(user: AuthenticatedRequestUser): Promise<{ items: FinancialHistoryItem[] }> {
    this.ensureAdministrator(user);
    const items = await this.ledgerRepository.findByOrganization(user.organizationId, {
      types: ["payment_created", "payment_succeeded", "payment_failed"],
    });
    return { items: items.map(toHistoryItem) };
  }

  public async getPayoutHistory(user: AuthenticatedRequestUser, providerId: string): Promise<{ items: FinancialHistoryItem[] }> {
    await this.ensureFinancialAccess(user, providerId);
    const items = await this.ledgerRepository.findByProvider(user.organizationId, providerId, {
      types: ["payout_requested", "payout_paid", "payout_failed"],
    });
    return { items: items.map(toHistoryItem) };
  }

  public async getOrganizationPayoutHistory(user: AuthenticatedRequestUser): Promise<{ items: FinancialHistoryItem[] }> {
    this.ensureAdministrator(user);
    const items = await this.ledgerRepository.findByOrganization(user.organizationId, {
      types: ["payout_requested", "payout_paid", "payout_failed"],
    });
    return { items: items.map(toHistoryItem) };
  }

  public async requestStripePayout(
    user: AuthenticatedRequestUser,
    providerId: string,
    input: unknown,
  ): Promise<StripePayoutResult> {
    const data = payoutSchema.parse(input);
    const provider = await this.ensureFinancialAccess(user, providerId);
    const stripeAccountId = this.requireStripeAccount(provider);
    const account = await this.stripeService.retrieveAccount(stripeAccountId);
    await this.saveStripeAccountSnapshot(user.organizationId, providerId, account);
    this.assertVerifiedAccount(account, "payout");

    const idempotencyKey = data.idempotencyKey ?? `payout:${providerId}:${randomUUID()}`;
    const currency = data.currency.toLowerCase();
    const pendingPayout = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      return this.providerPayoutsRepository.createPending({
        organizationId: user.organizationId,
        providerId,
        stripeAccountId,
        idempotencyKey,
        amountCents: data.amountCents,
        currency,
      }, manager);
    });

    if (pendingPayout.stripePayoutId) {
      return {
        providerId,
        payoutId: pendingPayout.stripePayoutId,
        amount: pendingPayout.amountCents,
        currency: pendingPayout.currency,
        status: pendingPayout.status,
      };
    }

    try {
      const payout = await this.stripeService.createPayout({
        stripeAccountId,
        amountCents: data.amountCents,
        currency,
        idempotencyKey,
      });

      await this.providerPayoutsRepository.updateStripeResult({
        id: pendingPayout.id,
        stripePayoutId: payout.id,
        status: payout.status,
      });
      await this.ledgerRepository.append({
        organizationId: user.organizationId,
        providerId,
        payoutId: pendingPayout.id,
        stripeAccountId,
        stripeObjectId: payout.id,
        type: "payout_requested",
        amountCents: payout.amount,
        currency: payout.currency,
        status: payout.status,
      });

      return { providerId, payoutId: payout.id, amount: payout.amount, currency: payout.currency, status: payout.status };
    } catch (error) {
      await this.providerPayoutsRepository.updateStripeResult({
        id: pendingPayout.id,
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Payout request failed.",
      });
      throw error;
    }
  }

  public async requestOrganizationStripePayout(user: AuthenticatedRequestUser, input: unknown): Promise<StripePayoutResult> {
    this.ensureAdministrator(user);
    const data = payoutSchema.parse(input);
    const stripeAccountId = await this.requireOrganizationStripeAccount(user.organizationId);
    const account = await this.stripeService.retrieveAccount(stripeAccountId);
    await this.saveOrganizationStripeAccountSnapshot(user.organizationId, account);
    this.assertVerifiedAccount(account, "payout");

    const idempotencyKey = data.idempotencyKey ?? `payout:${user.organizationId}:${randomUUID()}`;
    const currency = data.currency.toLowerCase();
    const pendingPayout = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      return this.providerPayoutsRepository.createPending({
        organizationId: user.organizationId,
        providerId: null,
        stripeAccountId,
        idempotencyKey,
        amountCents: data.amountCents,
        currency,
      }, manager);
    });

    if (pendingPayout.stripePayoutId) {
      return {
        organizationId: user.organizationId,
        payoutId: pendingPayout.stripePayoutId,
        amount: pendingPayout.amountCents,
        currency: pendingPayout.currency,
        status: pendingPayout.status,
      };
    }

    try {
      const payout = await this.stripeService.createPayout({
        stripeAccountId,
        amountCents: data.amountCents,
        currency,
        idempotencyKey,
      });

      await this.providerPayoutsRepository.updateStripeResult({
        id: pendingPayout.id,
        stripePayoutId: payout.id,
        status: payout.status,
      });
      await this.ledgerRepository.append({
        organizationId: user.organizationId,
        providerId: null,
        payoutId: pendingPayout.id,
        stripeAccountId,
        stripeObjectId: payout.id,
        type: "payout_requested",
        amountCents: payout.amount,
        currency: payout.currency,
        status: payout.status,
      });

      return { organizationId: user.organizationId, payoutId: payout.id, amount: payout.amount, currency: payout.currency, status: payout.status };
    } catch (error) {
      await this.providerPayoutsRepository.updateStripeResult({
        id: pendingPayout.id,
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Payout request failed.",
      });
      throw error;
    }
  }

  public async buildBreakdown(
    organizationId: string,
    providerId: string,
    offeringId: string | null,
    paymentType: PaymentType,
    manager?: EntityManager,
  ): Promise<PaymentBreakdown> {
    const amountCents = await this.resolveOfferingPrice(organizationId, providerId, offeringId, manager);
    const settings = await this.organizationPaymentSettingsRepository.getOrCreateDefault(organizationId, manager);
    return this.paymentCalculatorService.calculate(paymentType, amountCents, {
      commissionRateBps: PLATFORM_COMMISSION_BPS,
      onlineDiscountBps: settings.onlineDiscountBps,
    });
  }

  public async prepareOnlinePayment(input: {
    booking: Booking;
    customerEmail?: string | null;
    serviceName?: string | null;
    manager?: EntityManager;
  }): Promise<Booking> {
    const stripeAccountId = await this.requireOrganizationStripeAccount(input.booking.organizationId, input.manager);
    const account = await this.stripeService.retrieveAccount(stripeAccountId);
    await this.saveOrganizationStripeAccountSnapshot(input.booking.organizationId, account, input.manager);
    this.assertVerifiedAccount(account, "payment");

    const idempotencyKey = `payment_intent:${input.booking.id}`;
    const transaction = await this.paymentTransactionsRepository.create({
      organizationId: input.booking.organizationId,
      bookingId: input.booking.id,
      providerId: input.booking.providerId,
      idempotencyKey,
      breakdown: {
        paymentType: input.booking.paymentType,
        originalAmountCents: input.booking.originalAmountCents,
        discountedAmountCents: input.booking.discountedAmountCents,
        onlineDiscountCents: input.booking.onlineDiscountCents,
        platformCommissionRateBps: PLATFORM_COMMISSION_BPS,
        platformCommissionCents: input.booking.platformCommissionCents,
        providerNetAmountCents: input.booking.providerNetAmountCents,
        paymentStatus: "pending",
      },
    }, input.manager);

    await this.ledgerRepository.append({
      organizationId: input.booking.organizationId,
      providerId: input.booking.providerId,
      bookingId: input.booking.id,
      stripeAccountId,
      type: "payment_created",
      amountCents: input.booking.discountedAmountCents,
      currency: "brl",
      status: "pending",
      metadata: {
        originalAmountCents: input.booking.originalAmountCents,
        discountedAmountCents: input.booking.discountedAmountCents,
        onlineDiscountCents: input.booking.onlineDiscountCents,
        platformCommissionCents: input.booking.platformCommissionCents,
        providerNetAmountCents: input.booking.providerNetAmountCents,
      },
    }, input.manager);

    const paymentIntent = await this.stripeService.createConnectedAccountPaymentIntent({
      amountCents: input.booking.discountedAmountCents,
      stripeAccountId,
      bookingId: input.booking.id,
      organizationId: input.booking.organizationId,
      providerId: input.booking.providerId,
      customerEmail: input.customerEmail ?? null,
      serviceName: input.serviceName ?? null,
      idempotencyKey,
    });

    await this.paymentTransactionsRepository.updateGatewayResult(transaction.id, {
      status: mapPaymentIntentStatus(paymentIntent.status),
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: getLatestChargeId(paymentIntent),
      clientSecret: paymentIntent.client_secret ?? null,
      checkoutUrl: null,
      rawGatewayPayload: paymentIntent,
    }, input.manager);

    const updatedBooking = await this.bookingsRepository.updateInOrganization(input.booking.organizationId, input.booking.id, {
      paymentCheckoutUrl: null,
      paymentStatus: "pending",
    }, input.manager);

    if (!updatedBooking) {
      throw new AppError("bookings.not_found", "Booking not found.", 404);
    }

    return { ...updatedBooking, paymentClientSecret: paymentIntent.client_secret ?? null };
  }

  public async handleStripeWebhook(input: {
    rawBody: Buffer;
    signature?: string;
  }): Promise<{ received: true; eventType: string; duplicate?: boolean }> {
    const event = this.stripeService.constructWebhookEvent(input.rawBody, input.signature);
    const started = await this.webhookEventsRepository.tryStartProcessing({
      stripeEventId: event.id,
      eventType: event.type,
      payload: event,
    });
    if (!started) {
      return { received: true, eventType: event.type, duplicate: true };
    }

    if (event.type === "payment_intent.succeeded") await this.handlePaymentIntentSucceeded(event, event.data.object as PaymentIntent);
    if (event.type === "payment_intent.payment_failed") await this.handlePaymentIntentFailed(event, event.data.object as PaymentIntent);
    if (event.type === "checkout.session.completed") await this.billingService.handleSubscriptionCheckoutCompleted(event.data.object as Session);
    if (event.type === "checkout.session.expired") await this.billingService.handleSubscriptionCheckoutExpired(event.data.object as Session);
    if (event.type === "customer.subscription.created") await this.billingService.handleSubscriptionChanged(event.data.object as Subscription);
    if (event.type === "customer.subscription.updated") await this.billingService.handleSubscriptionChanged(event.data.object as Subscription);
    if (event.type === "customer.subscription.paused") await this.billingService.handleSubscriptionChanged(event.data.object as Subscription);
    if (event.type === "customer.subscription.resumed") await this.billingService.handleSubscriptionChanged(event.data.object as Subscription);
    if (event.type === "customer.subscription.deleted") await this.billingService.handleSubscriptionDeleted(event.data.object as Subscription);
    if (event.type === "invoice.paid") await this.billingService.handleSubscriptionInvoicePaid(event.data.object as Invoice);
    if (event.type === "invoice.payment_failed") await this.billingService.handleSubscriptionInvoicePaymentFailed(event.data.object as Invoice);
    if (event.type === "invoice.payment_action_required") await this.billingService.handleSubscriptionInvoicePaymentFailed(event.data.object as Invoice);
    if (event.type === "invoice.finalization_failed") await this.billingService.handleSubscriptionInvoicePaymentFailed(event.data.object as Invoice);
    if (event.type === "account.updated") await this.handleAccountUpdated(event, event.data.object as Account);
    if (event.type === "payout.paid") await this.handlePayoutPaid(event);
    if (event.type === "payout.failed") await this.handlePayoutFailed(event);

    await this.webhookEventsRepository.markProcessed(event.id);
    return { received: true, eventType: event.type };
  }

  private async handlePaymentIntentSucceeded(event: Event, paymentIntent: PaymentIntent): Promise<void> {
    await this.handlePaymentIntentTerminalEvent(event, paymentIntent, "approved", "payment_succeeded");
  }

  private async handlePaymentIntentFailed(event: Event, paymentIntent: PaymentIntent): Promise<void> {
    await this.handlePaymentIntentTerminalEvent(event, paymentIntent, "rejected", "payment_failed");
  }

  private async handlePaymentIntentTerminalEvent(
    event: Event,
    paymentIntent: PaymentIntent,
    paymentStatus: BookingPaymentStatus,
    ledgerType: "payment_succeeded" | "payment_failed",
  ): Promise<void> {
    await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const transaction = await this.paymentTransactionsRepository.findByStripePaymentIntentId(paymentIntent.id, manager);
      if (!transaction) throw new AppError("payments.transaction_not_found", "Payment transaction not found.", 404);

      this.validatePaymentIntentAgainstTransaction(paymentIntent, transaction);
      await this.paymentTransactionsRepository.updateGatewayResult(transaction.id, {
        status: paymentStatus,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: getLatestChargeId(paymentIntent),
        rawGatewayPayload: paymentIntent,
      }, manager);

      const booking = await this.bookingsRepository.updateInOrganization(transaction.organizationId, transaction.bookingId, {
        paymentStatus,
        ...(paymentStatus === "approved" ? { status: "confirmed" as const } : { status: "cancelled" as const }),
      }, manager);
      if (!booking) throw new AppError("bookings.not_found", "Booking not found.", 404);

      await this.ledgerRepository.append({
        organizationId: transaction.organizationId,
        providerId: transaction.providerId,
        bookingId: transaction.bookingId,
        stripeAccountId: event.account ?? "",
        stripeObjectId: paymentIntent.id,
        stripeEventId: event.id,
        type: ledgerType,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentStatus,
        failureReason: paymentIntent.last_payment_error?.message ?? null,
      }, manager);

      if (paymentStatus === "approved") {
        await this.notificationsService.handleBookingEvent({
          id: "stripe-webhook",
          organizationId: transaction.organizationId,
          role: "administrator",
          sessionId: "stripe-webhook",
        }, { type: "booking.confirmed", booking }, manager);
      }
    });
  }

  private async handleAccountUpdated(event: Event, account: Account): Promise<void> {
    const organizationSettings = await this.organizationPaymentSettingsRepository.findByStripeAccountId(account.id);
    if (organizationSettings) {
      const status = await this.saveOrganizationStripeAccountSnapshot(organizationSettings.organizationId, this.stripeService.toAccountSnapshot(account));
      await this.ledgerRepository.append({
        organizationId: organizationSettings.organizationId,
        providerId: null,
        stripeAccountId: account.id,
        stripeObjectId: account.id,
        stripeEventId: event.id,
        type: status === "verified" ? "account_verified" : "account_restricted",
        amountCents: 0,
        currency: "brl",
        status,
        failureReason: account.requirements?.disabled_reason ?? null,
      });
      return;
    }

    const provider = await this.providersRepository.findByStripeAccountId(account.id);
    if (!provider) return;
    const status = await this.saveStripeAccountSnapshot(provider.organizationId, provider.id, this.stripeService.toAccountSnapshot(account));
    await this.ledgerRepository.append({
      organizationId: provider.organizationId,
      providerId: provider.id,
      stripeAccountId: account.id,
      stripeObjectId: account.id,
      stripeEventId: event.id,
      type: status === "verified" ? "account_verified" : "account_restricted",
      amountCents: 0,
      currency: "brl",
      status,
      failureReason: account.requirements?.disabled_reason ?? null,
    });
  }

  private async handlePayoutPaid(event: Event): Promise<void> {
    await this.handlePayoutTerminalEvent(event, "paid", "payout_paid");
  }

  private async handlePayoutFailed(event: Event): Promise<void> {
    await this.handlePayoutTerminalEvent(event, "failed", "payout_failed");
  }

  private async handlePayoutTerminalEvent(event: Event, status: "paid" | "failed", ledgerType: "payout_paid" | "payout_failed"): Promise<void> {
    const payout = event.data.object as Payout;
    const stripeAccountId = event.account;
    if (!stripeAccountId) return;
    const organizationSettings = await this.organizationPaymentSettingsRepository.findByStripeAccountId(stripeAccountId);
    const provider = organizationSettings ? null : await this.providersRepository.findByStripeAccountId(stripeAccountId);
    if (!organizationSettings && !provider) return;
    const organizationId = organizationSettings?.organizationId ?? provider?.organizationId;
    if (!organizationId) return;
    const current = await this.providerPayoutsRepository.findByStripePayoutId(payout.id);
    if (current) {
      await this.providerPayoutsRepository.updateStripeResult({
        id: current.id,
        stripePayoutId: payout.id,
        status,
        failureReason: payout.failure_message ?? null,
      });
    }
    await this.ledgerRepository.append({
      organizationId,
      providerId: provider?.id ?? null,
      payoutId: current?.id ?? null,
      stripeAccountId,
      stripeObjectId: payout.id,
      stripeEventId: event.id,
      type: ledgerType,
      amountCents: payout.amount,
      currency: payout.currency,
      status,
      failureReason: payout.failure_message ?? null,
    });
  }

  private validatePaymentIntentAgainstTransaction(paymentIntent: PaymentIntent, transaction: {
    organizationId: string;
    providerId: string;
    bookingId: string;
    discountedAmountCents: number;
  }): void {
    if (
      paymentIntent.metadata?.bookingId !== transaction.bookingId
      || paymentIntent.metadata?.providerId !== transaction.providerId
      || paymentIntent.metadata?.organizationId !== transaction.organizationId
      || paymentIntent.amount !== transaction.discountedAmountCents
    ) {
      throw new AppError("payments.invalid_webhook_metadata", "Os dados da confirmação de pagamento não correspondem à transação registrada.", 409);
    }
  }

  private async getProvider(organizationId: string, providerId: string, manager?: EntityManager): Promise<Provider> {
    const provider = await this.providersRepository.findByIdInOrganization(organizationId, providerId, manager);
    if (!provider) throw new AppError("providers.not_found", "Provider not found.", 404);
    return provider;
  }

  private async ensureFinancialAccess(user: AuthenticatedRequestUser, providerId: string): Promise<Provider> {
    if (user.role === "provider" && user.providerId !== providerId) {
      throw new AppError("auth.forbidden", "Provider cannot access another provider financial data.", 403);
    }
    return this.getProvider(user.organizationId, providerId);
  }

  private ensureAdministrator(user: AuthenticatedRequestUser): void {
    if (user.role !== "administrator") {
      throw new AppError("auth.forbidden", "Somente administradores podem gerenciar a conta de pagamentos.", 403);
    }
  }

  private requireStripeAccount(provider: Provider): string {
    if (!provider.stripeAccountId) throw new AppError("payments.stripe_account_required", "A verificação de identidade precisa ser concluída antes.", 409);
    return provider.stripeAccountId;
  }

  private async requireOrganizationStripeAccount(organizationId: string, manager?: EntityManager): Promise<string> {
    const settings = await this.organizationPaymentSettingsRepository.getOrCreateDefault(organizationId, manager);
    if (!settings.stripeAccountId) {
      throw new AppError("payments.stripe_account_required", "A organização precisa concluir a verificação de identidade antes.", 409);
    }
    return settings.stripeAccountId;
  }

  private buildAccountStatusResponse(subject: { organizationId?: string; providerId?: string }, account: {
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    disabledReason?: string | null;
    status: StripeAccountStatus;
  }): StripeAccountStatusResponse {
    const blockedReasons = [
      ...(!account.detailsSubmitted ? ["kyc_details_missing"] : []),
      ...(!account.chargesEnabled ? ["charges_not_enabled"] : []),
      ...(!account.payoutsEnabled ? ["payouts_not_enabled"] : []),
      ...(account.disabledReason ? [account.disabledReason] : []),
      ...account.currentlyDue,
      ...account.pastDue,
    ];

    return {
      ...subject,
      status: account.status,
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
      currentlyDue: account.currentlyDue,
      eventuallyDue: account.eventuallyDue,
      pastDue: account.pastDue,
      disabledReason: account.disabledReason ?? null,
      canReceivePayments: account.status === "verified",
      canRequestPayouts: account.status === "verified",
      blockedReasons,
    };
  }

  private assertVerifiedAccount(account: { status: StripeAccountStatus }, operation: "payment" | "payout"): void {
    if (account.status !== "verified") {
      throw new AppError(
        operation === "payment" ? "payments.provider_not_eligible" : "payments.payout_account_not_verified",
        operation === "payment"
          ? "A conta de pagamentos ainda não está apta para receber pagamentos online."
          : "A conta de pagamentos precisa estar verificada antes de solicitar saques.",
        409,
      );
    }
  }

  private async saveStripeAccountSnapshot(
    organizationId: string,
    providerId: string,
    account: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      currentlyDue: string[];
      eventuallyDue: string[];
      pastDue: string[];
      disabledReason?: string | null;
      status: StripeAccountStatus;
    },
    manager?: EntityManager,
  ): Promise<StripeAccountStatus> {
    await this.providerPaymentSettingsRepository.updateStripeAccountStatus(organizationId, providerId, {
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
      currentlyDue: account.currentlyDue,
      eventuallyDue: account.eventuallyDue,
      pastDue: account.pastDue,
      disabledReason: account.disabledReason ?? null,
      accountStatus: account.status,
    }, manager);
    return account.status;
  }

  private async saveOrganizationStripeAccountSnapshot(
    organizationId: string,
    account: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      currentlyDue: string[];
      eventuallyDue: string[];
      pastDue: string[];
      disabledReason?: string | null;
      status: StripeAccountStatus;
    },
    manager?: EntityManager,
  ): Promise<StripeAccountStatus> {
    await this.organizationPaymentSettingsRepository.updateStripeAccountStatus(organizationId, {
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
      currentlyDue: account.currentlyDue,
      eventuallyDue: account.eventuallyDue,
      pastDue: account.pastDue,
      disabledReason: account.disabledReason ?? null,
      accountStatus: account.status,
    }, manager);
    return account.status;
  }

  private async getExistingStripeAccount(user: AuthenticatedRequestUser, providerId: string): Promise<StripeConnectAccount> {
    const provider = await this.ensureFinancialAccess(user, providerId);
    const stripeAccountId = this.requireStripeAccount(provider);
    const account = await this.stripeService.retrieveAccount(stripeAccountId);
    await this.saveStripeAccountSnapshot(user.organizationId, providerId, account);
    return {
      providerId,
      stripeAccountId,
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
    };
  }

  private async resolveOfferingPrice(
    organizationId: string,
    providerId: string,
    offeringId: string | null,
    manager?: EntityManager,
  ): Promise<number> {
    if (!offeringId) return 0;
    const offering = await this.serviceOfferingsRepository.findByIdInOrganization(organizationId, offeringId, manager);
    if (!offering || offering.providerId !== providerId || !offering.isActive) {
      throw new AppError("service_offerings.not_found", "Service offering not found.", 404);
    }
    return offering.priceCents ?? 0;
  }
}
