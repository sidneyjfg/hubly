import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";

import { AppointmentsController } from "../controllers/appointments.controller";
import {
  appointmentActionRouteSchema,
  appointmentsCreateRouteSchema,
  appointmentsDailyScheduleRouteSchema,
  appointmentsListRouteSchema,
  appointmentsRescheduleRouteSchema,
  appointmentsWeeklyScheduleRouteSchema,
} from "../docs/route-schemas";
import { criticalRouteRateLimitMiddleware } from "../middlewares/request-protection";
import { allowRoles } from "../middlewares/rbac";
import { AppointmentsRepository } from "../repositories/appointments.repository";
import { AppointmentNotificationsRepository } from "../repositories/appointment-notifications.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { ClinicIntegrationsRepository } from "../repositories/clinic-integrations.repository";
import { ClinicNotificationSettingsRepository } from "../repositories/clinic-notification-settings.repository";
import { ClinicsRepository } from "../repositories/clinics.repository";
import { PatientsRepository } from "../repositories/patients.repository";
import { ProfessionalServicesRepository } from "../repositories/professional-services.repository";
import { ProfessionalsRepository } from "../repositories/professionals.repository";
import { AppointmentsService } from "../services/appointments.service";
import { EvolutionWhatsAppService } from "../services/evolution-whatsapp.service";
import { NotificationsService } from "../services/notifications.service";

type AppointmentsRouteOptions = {
  dataSource: DataSource;
};

export const appointmentsRoutes = async (
  app: FastifyInstance,
  options: AppointmentsRouteOptions,
): Promise<void> => {
  const notificationsService = new NotificationsService(
    options.dataSource,
    new ClinicNotificationSettingsRepository(options.dataSource),
    new AppointmentNotificationsRepository(options.dataSource),
    new AppointmentsRepository(options.dataSource),
    new PatientsRepository(options.dataSource),
    new ClinicsRepository(options.dataSource),
    new ClinicIntegrationsRepository(options.dataSource),
    new AuditRepository(options.dataSource),
    new EvolutionWhatsAppService(),
  );

  const appointmentsController = new AppointmentsController(
    new AppointmentsService(
      options.dataSource,
      new AppointmentsRepository(options.dataSource),
      new PatientsRepository(options.dataSource),
      new ProfessionalsRepository(options.dataSource),
      new AuditRepository(options.dataSource),
      notificationsService,
      new ProfessionalServicesRepository(options.dataSource),
    ),
  );

  app.get(
    "/appointments",
    {
      preHandler: allowRoles(["administrator", "reception", "professional"]),
      schema: appointmentsListRouteSchema,
    },
    appointmentsController.list,
  );

  app.post(
    "/appointments",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("appointments:create")],
      schema: appointmentsCreateRouteSchema,
    },
    appointmentsController.create,
  );

  app.patch(
    "/appointments/:id/cancel",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("appointments:cancel")],
      schema: appointmentActionRouteSchema,
    },
    appointmentsController.cancel,
  );

  app.patch(
    "/appointments/:id/reschedule",
    {
      preHandler: [allowRoles(["administrator", "reception"]), criticalRouteRateLimitMiddleware("appointments:reschedule")],
      schema: appointmentsRescheduleRouteSchema,
    },
    appointmentsController.reschedule,
  );

  app.patch(
    "/appointments/:id/attendance",
    {
      preHandler: [
        allowRoles(["administrator", "reception", "professional"]),
        criticalRouteRateLimitMiddleware("appointments:attendance"),
      ],
      schema: appointmentActionRouteSchema,
    },
    appointmentsController.markAttended,
  );

  app.patch(
    "/appointments/:id/missed",
    {
      preHandler: [
        allowRoles(["administrator", "reception", "professional"]),
        criticalRouteRateLimitMiddleware("appointments:missed"),
      ],
      schema: appointmentActionRouteSchema,
    },
    appointmentsController.markMissed,
  );

  app.get(
    "/appointments/daily-schedule",
    {
      preHandler: allowRoles(["administrator", "reception", "professional"]),
      schema: appointmentsDailyScheduleRouteSchema,
    },
    appointmentsController.dailySchedule,
  );

  app.get(
    "/appointments/weekly-schedule",
    {
      preHandler: allowRoles(["administrator", "reception", "professional"]),
      schema: appointmentsWeeklyScheduleRouteSchema,
    },
    appointmentsController.weeklySchedule,
  );
};
