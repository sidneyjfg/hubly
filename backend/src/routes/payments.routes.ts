import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { PaymentsController } from "../controllers/payments.controller";
import { AuditRepository } from "../repositories/audit.repository";
import { BookingNotificationsRepository } from "../repositories/booking-notifications.repository";
import { BookingsRepository } from "../repositories/bookings.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { OrganizationPaymentSettingsRepository } from "../repositories/organization-payment-settings.repository";
import { PaymentTransactionsRepository } from "../repositories/payment-transactions.repository";
import { ProviderPaymentSettingsRepository } from "../repositories/provider-payment-settings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { allowRoles } from "../middlewares/rbac";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { EvolutionWhatsAppService } from "../services/evolution-whatsapp.service";
import { MercadoPagoService } from "../services/mercado-pago.service";
import { NotificationsService } from "../services/notifications.service";
import { PaymentCalculatorService } from "../services/payment-calculator.service";
import { PaymentsService } from "../services/payments.service";

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
    new MercadoPagoService(),
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
    "/organization/mercado-pago/connect",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:connect")],
    },
    controller.createOrganizationMercadoPagoConnectUrl,
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
    "/providers/:providerId/mercado-pago/connect",
    {
      preHandler: [allowRoles(["administrator"]), criticalRouteRateLimitMiddleware("payments:connect")],
    },
    controller.createMercadoPagoConnectUrl,
  );

  app.get("/public/payments/mercado-pago/oauth/callback", controller.handleMercadoPagoOAuthCallback);
  app.post("/public/payments/mercado-pago/webhooks", controller.handleMercadoPagoWebhook);
};
