import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { PublicBookingsController } from "../controllers/public-bookings.controller";
import {
  publicBookingAvailabilityRouteSchema,
  publicBookingCreateRouteSchema,
  publicBookingPageRouteSchema,
} from "../docs/route-schemas";
import { AuditRepository } from "../repositories/audit.repository";
import { BookingNotificationsRepository } from "../repositories/booking-notifications.repository";
import { BookingsRepository } from "../repositories/bookings.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { ProviderAvailabilitiesRepository } from "../repositories/provider-availabilities.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { EvolutionWhatsAppService } from "../services/evolution-whatsapp.service";
import { NotificationsService } from "../services/notifications.service";
import { PublicBookingsService } from "../services/public-bookings.service";
import { buildPaymentsService } from "./payments.routes";

type PublicBookingsRouteOptions = {
  dataSource: DataSource;
};

export const publicBookingsRoutes = async (
  app: FastifyInstance,
  options: PublicBookingsRouteOptions,
): Promise<void> => {
  const notificationsService = new NotificationsService(
    options.dataSource,
    new OrganizationNotificationSettingsRepository(options.dataSource),
    new BookingNotificationsRepository(options.dataSource),
    new BookingsRepository(options.dataSource),
    new CustomersRepository(options.dataSource),
    new OrganizationsRepository(options.dataSource),
    new OrganizationIntegrationsRepository(options.dataSource),
    new AuditRepository(options.dataSource),
    new EvolutionWhatsAppService(),
  );

  const controller = new PublicBookingsController(
    new PublicBookingsService(
      options.dataSource,
      new OrganizationsRepository(options.dataSource),
      new ProvidersRepository(options.dataSource),
      new ServiceOfferingsRepository(options.dataSource),
      new ProviderAvailabilitiesRepository(options.dataSource),
      new CustomersRepository(options.dataSource),
      new BookingsRepository(options.dataSource),
      notificationsService,
      new AuditRepository(options.dataSource),
      buildPaymentsService(options.dataSource),
    ),
  );

  app.get("/public/organizations/:slug", { schema: publicBookingPageRouteSchema }, controller.getBookingPage);
  app.get("/public/organizations/:slug/availability", { schema: publicBookingAvailabilityRouteSchema }, controller.getAvailability);
  app.post("/public/organizations/:slug/bookings", { schema: publicBookingCreateRouteSchema }, controller.createBooking);
};
