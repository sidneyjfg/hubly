import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { BookingsController } from "../controllers/bookings.controller";
import {
  bookingActionRouteSchema,
  bookingsCreateRouteSchema,
  bookingsDailyScheduleRouteSchema,
  bookingsListRouteSchema,
  bookingsRescheduleRouteSchema,
  bookingsWeeklyScheduleRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { BookingsRepository } from "../repositories/bookings.repository";
import { BookingNotificationsRepository } from "../repositories/booking-notifications.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { ProviderAvailabilitiesRepository } from "../repositories/provider-availabilities.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { BookingsService } from "../services/bookings.service";
import { EvolutionWhatsAppService } from "../services/evolution-whatsapp.service";
import { NotificationsService } from "../services/notifications.service";

type BookingsRouteOptions = {
  dataSource: DataSource;
};

export const bookingsRoutes = async (
  app: FastifyInstance,
  options: BookingsRouteOptions,
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

  const bookingsController = new BookingsController(
    new BookingsService(
      options.dataSource,
      new BookingsRepository(options.dataSource),
      new CustomersRepository(options.dataSource),
      new ProvidersRepository(options.dataSource),
      new ProviderAvailabilitiesRepository(options.dataSource),
      new AuditRepository(options.dataSource),
      notificationsService,
      new ServiceOfferingsRepository(options.dataSource),
    ),
  );

  app.get(
    "/bookings",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: bookingsListRouteSchema,
    },
    bookingsController.list,
  );

  app.post(
    "/bookings",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("bookings:create")],
      schema: bookingsCreateRouteSchema,
    },
    bookingsController.create,
  );

  app.patch(
    "/bookings/:id/cancel",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("bookings:cancel")],
      schema: bookingActionRouteSchema,
    },
    bookingsController.cancel,
  );

  app.patch(
    "/bookings/:id/reschedule",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("bookings:reschedule")],
      schema: bookingsRescheduleRouteSchema,
    },
    bookingsController.reschedule,
  );

  app.patch(
    "/bookings/:id/attendance",
    {
      preHandler: [
        allowRoles(["administrator", "reception", "provider"]),
        criticalRouteRateLimitMiddleware("bookings:attendance"),
      ],
      schema: bookingActionRouteSchema,
    },
    bookingsController.markAttended,
  );

  app.patch(
    "/bookings/:id/missed",
    {
      preHandler: [
        allowRoles(["administrator", "reception", "provider"]),
        criticalRouteRateLimitMiddleware("bookings:missed"),
      ],
      schema: bookingActionRouteSchema,
    },
    bookingsController.markMissed,
  );

  app.get(
    "/bookings/daily-schedule",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: bookingsDailyScheduleRouteSchema,
    },
    bookingsController.dailySchedule,
  );

  app.get(
    "/bookings/weekly-schedule",
    {
      preHandler: allowRoles(["administrator", "reception", "provider"]),
      schema: bookingsWeeklyScheduleRouteSchema,
    },
    bookingsController.weeklySchedule,
  );
};
