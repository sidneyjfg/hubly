import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";

import { AuditRepository } from "../repositories/audit.repository";
import { BookingsRepository } from "../repositories/bookings.repository";
import { PaymentTransactionsRepository } from "../repositories/payment-transactions.repository";
import { ProviderPaymentSettingsRepository } from "../repositories/provider-payment-settings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Booking, BookingPaymentStatus } from "../types/booking";
import type { MercadoPagoOAuthConnectUrl, MercadoPagoWebhookInput, PaymentBreakdown, PaymentType } from "../types/payment";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";
import { PaymentCalculatorService } from "./payment-calculator.service";
import { MercadoPagoService } from "./mercado-pago.service";
import { NotificationsService } from "./notifications.service";

const paymentSettingsSchema = z.object({
  commissionRateBps: z.number().int().min(0).max(10000).optional(),
  onlineDiscountBps: z.number().int().min(0).max(10000).optional(),
  absorbsProcessingFee: z.boolean().optional(),
});

const oauthCallbackSchema = z.object({
  code: z.string().min(10),
  state: z.string().min(3),
});

const splitState = (state: string): { organizationId: string; providerId: string } => {
  const [organizationId, providerId] = state.split(":");

  if (!organizationId || !providerId) {
    throw new AppError("payments.invalid_oauth_state", "Invalid OAuth state.", 400);
  }

  return { organizationId, providerId };
};

const mapMercadoPagoStatus = (status: string | undefined): BookingPaymentStatus => {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected") {
    return "rejected";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  return "pending";
};

export class PaymentsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly providerPaymentSettingsRepository: ProviderPaymentSettingsRepository,
    private readonly providersRepository: ProvidersRepository,
    private readonly serviceOfferingsRepository: ServiceOfferingsRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly paymentTransactionsRepository: PaymentTransactionsRepository,
    private readonly auditRepository: AuditRepository,
    private readonly notificationsService: NotificationsService,
    private readonly paymentCalculatorService: PaymentCalculatorService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  public async getProviderSettings(user: AuthenticatedRequestUser, providerId: string) {
    await this.ensureProvider(user.organizationId, providerId);
    return this.providerPaymentSettingsRepository.getOrCreateDefault(user.organizationId, providerId);
  }

  public async updateProviderSettings(
    user: AuthenticatedRequestUser,
    providerId: string,
    input: unknown,
  ) {
    await this.ensureProvider(user.organizationId, providerId);
    const data = paymentSettingsSchema.parse(input);
    const updateInput = {
      ...(data.commissionRateBps === undefined ? {} : { commissionRateBps: data.commissionRateBps }),
      ...(data.onlineDiscountBps === undefined ? {} : { onlineDiscountBps: data.onlineDiscountBps }),
      ...(data.absorbsProcessingFee === undefined ? {} : { absorbsProcessingFee: data.absorbsProcessingFee }),
    };

    return this.providerPaymentSettingsRepository.updateInOrganization(user.organizationId, providerId, updateInput);
  }

  public async createMercadoPagoConnectUrl(
    user: AuthenticatedRequestUser,
    providerId: string,
  ): Promise<MercadoPagoOAuthConnectUrl> {
    await this.ensureProvider(user.organizationId, providerId);
    const state = `${user.organizationId}:${providerId}`;

    return {
      providerId,
      authorizationUrl: this.mercadoPagoService.buildOAuthAuthorizationUrl(state),
    };
  }

  public async handleMercadoPagoOAuthCallback(input: unknown) {
    const data = oauthCallbackSchema.parse(input);
    const { organizationId, providerId } = splitState(data.state);
    await this.ensureProvider(organizationId, providerId);
    const token = await this.mercadoPagoService.exchangeOAuthCode(data.code);
    const expiresAt = new Date(Date.now() + token.expires_in * 1000);

    const settings = await this.providerPaymentSettingsRepository.saveMercadoPagoConnection(
      organizationId,
      providerId,
      {
        mercadoPagoUserId: String(token.user_id),
        mercadoPagoAccessToken: token.access_token,
        mercadoPagoRefreshToken: token.refresh_token,
        mercadoPagoTokenExpiresAt: expiresAt,
      },
    );

    await this.auditRepository.create({
      organizationId,
      actorId: null,
      action: "provider_payment.mercado_pago_connected",
      targetType: "provider",
      targetId: providerId,
    });

    return settings;
  }

  public async buildBreakdown(
    organizationId: string,
    providerId: string,
    offeringId: string | null,
    paymentType: PaymentType,
    manager?: EntityManager,
  ): Promise<PaymentBreakdown> {
    const amountCents = await this.resolveOfferingPrice(organizationId, providerId, offeringId, manager);
    const settings = await this.providerPaymentSettingsRepository.getOrCreateDefault(organizationId, providerId, manager);

    return this.paymentCalculatorService.calculate(paymentType, amountCents, settings);
  }

  public async prepareOnlinePayment(input: {
    booking: Booking;
    customerEmail?: string | null;
    serviceName?: string | null;
    manager: EntityManager;
  }): Promise<Booking> {
    const settings = await this.providerPaymentSettingsRepository.getOrCreateDefault(
      input.booking.organizationId,
      input.booking.providerId,
      input.manager,
    );

    if (!settings.mercadoPagoConnected || !settings.mercadoPagoAccessToken) {
      throw new AppError("payments.provider_not_connected", "Provider must connect Mercado Pago before online payments.", 409);
    }

    const transaction = await this.paymentTransactionsRepository.create(
      {
        organizationId: input.booking.organizationId,
        bookingId: input.booking.id,
        providerId: input.booking.providerId,
        breakdown: {
          paymentType: input.booking.paymentType,
          originalAmountCents: input.booking.originalAmountCents,
          discountedAmountCents: input.booking.discountedAmountCents,
          onlineDiscountCents: input.booking.onlineDiscountCents,
          platformCommissionRateBps: input.booking.platformCommissionRateBps,
          platformCommissionCents: input.booking.platformCommissionCents,
          providerNetAmountCents: input.booking.providerNetAmountCents,
          paymentStatus: "pending",
        },
      },
      input.manager,
    );

    const preference = await this.mercadoPagoService.createMarketplacePreference({
      accessToken: settings.mercadoPagoAccessToken,
      bookingId: input.booking.id,
      title: input.serviceName ?? "Agendamento Hubly",
      payerEmail: input.customerEmail ?? null,
      amountCents: input.booking.discountedAmountCents,
      platformCommissionCents: input.booking.platformCommissionCents,
      notificationUrl: `${env.PUBLIC_API_BASE_URL}/v1/public/payments/mercado-pago/webhooks?bookingId=${encodeURIComponent(input.booking.id)}`,
    });

    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point ?? null;

    await this.paymentTransactionsRepository.updateGatewayResult(
      transaction.id,
      {
        status: "pending",
        mercadoPagoPreferenceId: preference.id,
        checkoutUrl,
        rawGatewayPayload: preference,
      },
      input.manager,
    );

    const updatedBooking = await this.bookingsRepository.updateInOrganization(
      input.booking.organizationId,
      input.booking.id,
      {
        paymentCheckoutUrl: checkoutUrl,
        paymentStatus: "pending",
      },
      input.manager,
    );

    if (!updatedBooking) {
      throw new AppError("bookings.not_found", "Booking not found.", 404);
    }

    return updatedBooking;
  }

  public async handleMercadoPagoWebhook(input: MercadoPagoWebhookInput) {
    const bookingId = input.bookingId;
    if (!bookingId) {
      throw new AppError("payments.booking_id_required", "Booking id is required for Mercado Pago webhook.", 400);
    }

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const transaction = await this.paymentTransactionsRepository.findLatestByBookingId(bookingId, manager);
      if (!transaction) {
        throw new AppError("payments.transaction_not_found", "Payment transaction not found.", 404);
      }

      const settings = await this.providerPaymentSettingsRepository.getOrCreateDefault(
        transaction.organizationId,
        transaction.providerId,
        manager,
      );

      if (!settings.mercadoPagoAccessToken) {
        throw new AppError("payments.provider_not_connected", "Provider Mercado Pago connection not found.", 409);
      }

      const paymentId = input.paymentId;
      const payment = paymentId ? await this.mercadoPagoService.getPayment(settings.mercadoPagoAccessToken, paymentId) : null;
      const paymentStatus = mapMercadoPagoStatus(payment?.status);

      await this.paymentTransactionsRepository.updateGatewayResult(
        transaction.id,
        {
          status: paymentStatus,
          mercadoPagoPaymentId: payment ? String(payment.id) : paymentId ?? null,
          rawGatewayPayload: payment ?? input.payload,
        },
        manager,
      );

      const bookingUpdate = {
        paymentStatus,
        ...(paymentStatus === "approved" ? { status: "confirmed" as const } : {}),
      };

      const booking = await this.bookingsRepository.updateInOrganization(
        transaction.organizationId,
        bookingId,
        bookingUpdate,
        manager,
      );

      if (!booking) {
        throw new AppError("bookings.not_found", "Booking not found.", 404);
      }

      await this.auditRepository.create(
        {
          organizationId: transaction.organizationId,
          actorId: null,
          action: `payment.${paymentStatus}`,
          targetType: "booking",
          targetId: bookingId,
        },
        manager,
      );

      if (paymentStatus === "approved") {
        await this.notificationsService.handleBookingEvent(
          {
            id: "payment-webhook",
            organizationId: transaction.organizationId,
            role: "administrator",
            sessionId: "payment-webhook",
          },
          {
            type: "booking.confirmed",
            booking,
          },
          manager,
        );
      }

      return { received: true, bookingId, paymentStatus };
    });
  }

  private async ensureProvider(organizationId: string, providerId: string): Promise<void> {
    const provider = await this.providersRepository.findByIdInOrganization(organizationId, providerId);
    if (!provider) {
      throw new AppError("providers.not_found", "Provider not found.", 404);
    }
  }

  private async resolveOfferingPrice(
    organizationId: string,
    providerId: string,
    offeringId: string | null,
    manager?: EntityManager,
  ): Promise<number> {
    if (!offeringId) {
      return 0;
    }

    const offering = await this.serviceOfferingsRepository.findByIdInOrganization(organizationId, offeringId, manager);
    if (!offering || offering.providerId !== providerId || !offering.isActive) {
      throw new AppError("service_offerings.not_found", "Service offering not found.", 404);
    }

    return offering.priceCents ?? 0;
  }
}
