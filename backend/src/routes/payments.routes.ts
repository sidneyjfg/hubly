import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { PaymentsController } from "../controllers/payments.controller";
import { AuditRepository } from "../repositories/audit.repository";
import { BookingNotificationsRepository } from "../repositories/booking-notifications.repository";
import { BookingsRepository } from "../repositories/bookings.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { FinancialLedgerRepository } from "../repositories/financial-ledger.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { OrganizationPaymentSettingsRepository } from "../repositories/organization-payment-settings.repository";
import { PaymentTransactionsRepository } from "../repositories/payment-transactions.repository";
import { ProviderPayoutsRepository } from "../repositories/provider-payouts.repository";
import { ProviderPaymentSettingsRepository } from "../repositories/provider-payment-settings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { StripeWebhookEventsRepository } from "../repositories/stripe-webhook-events.repository";
import { allowRoles } from "../middlewares/rbac";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { EvolutionWhatsAppService } from "../services/evolution-whatsapp.service";
import { NotificationsService } from "../services/notifications.service";
import { PaymentCalculatorService } from "../services/payment-calculator.service";
import { PaymentsService } from "../services/payments.service";
import { PlanEntitlementsService } from "../services/plan-entitlements.service";
import { StripeService } from "../services/stripe.service";

type PaymentsRouteOptions = {
  dataSource: DataSource;
};

export const buildPaymentsService = (dataSource: DataSource): PaymentsService => {
  const bookingsRepository = new BookingsRepository(dataSource);
  const auditRepository = new AuditRepository(dataSource);
  const notificationsService = new NotificationsService(
    dataSource,
    new OrganizationNotificationSettingsRepository(dataSource),
    new BookingNotificationsRepository(dataSource),
    bookingsRepository,
    new CustomersRepository(dataSource),
    new OrganizationsRepository(dataSource),
    new OrganizationIntegrationsRepository(dataSource),
    auditRepository,
    new EvolutionWhatsAppService(),
    new PlanEntitlementsService(dataSource),
  );

  return new PaymentsService(
    dataSource,
    new OrganizationPaymentSettingsRepository(dataSource),
    new ProviderPaymentSettingsRepository(dataSource),
    new ProvidersRepository(dataSource),
    new ServiceOfferingsRepository(dataSource),
    bookingsRepository,
    new PaymentTransactionsRepository(dataSource),
    auditRepository,
    notificationsService,
    new PaymentCalculatorService(),
    new StripeService(),
    new StripeWebhookEventsRepository(dataSource),
    new FinancialLedgerRepository(dataSource),
    new ProviderPayoutsRepository(dataSource),
  );
};

export const paymentsRoutes = async (
  app: FastifyInstance,
  options: PaymentsRouteOptions,
): Promise<void> => {
  const controller = new PaymentsController(buildPaymentsService(options.dataSource));

  app.get(
    "/organization/payment-settings",
    {
      preHandler: allowRoles(["administrator"]),
    },
    controller.getOrganizationSettings,
  );

  app.patch(
    "/organization/payment-settings",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:settings")],
    },
    controller.updateOrganizationSettings,
  );

  app.post(
    "/organization/stripe/accounts",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:connect")],
    },
    controller.createOrganizationStripeExpressAccount,
  );

  app.post(
    "/organization/stripe/onboarding-links",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:onboarding")],
    },
    controller.createOrganizationStripeOnboardingLink,
  );

  app.get(
    "/organization/stripe/balance",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:balance")],
    },
    controller.getOrganizationStripeBalance,
  );

  app.post(
    "/organization/stripe/payouts",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:payout")],
    },
    controller.requestOrganizationStripePayout,
  );

  app.get(
    "/organization/stripe/account-status",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:account-status")],
    },
    controller.getOrganizationStripeAccountStatus,
  );

  app.get(
    "/organization/stripe/transactions",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:transactions")],
    },
    controller.getOrganizationTransactionHistory,
  );

  app.get(
    "/organization/stripe/payouts",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:payout-history")],
    },
    controller.getOrganizationPayoutHistory,
  );

  app.get(
    "/providers/:providerId/payment-settings",
    {
      preHandler: allowRoles(["administrator"]),
    },
    controller.getProviderSettings,
  );

  app.patch(
    "/providers/:providerId/payment-settings",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:settings")],
    },
    controller.updateProviderSettings,
  );

  app.post(
    "/providers/:providerId/stripe/accounts",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:connect")],
    },
    controller.createStripeExpressAccount,
  );

  app.post(
    "/providers/:providerId/stripe/onboarding-links",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("payments:onboarding")],
    },
    controller.createStripeOnboardingLink,
  );

  app.get(
    "/providers/:providerId/stripe/balance",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("payments:balance")],
    },
    controller.getStripeBalance,
  );

  app.post(
    "/providers/:providerId/stripe/payouts",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("payments:payout")],
    },
    controller.requestStripePayout,
  );

  app.get(
    "/providers/:providerId/stripe/account-status",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("payments:account-status")],
    },
    controller.getStripeAccountStatus,
  );

  app.get(
    "/providers/:providerId/stripe/transactions",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("payments:transactions")],
    },
    controller.getTransactionHistory,
  );

  app.get(
    "/providers/:providerId/stripe/payouts",
    {
      preHandler: [allowRoles(["administrator", "provider"]), criticalRouteRateLimitMiddleware("payments:payout-history")],
    },
    controller.getPayoutHistory,
  );

  app.post("/public/payments/stripe/webhooks", controller.handleStripeWebhook);
};
