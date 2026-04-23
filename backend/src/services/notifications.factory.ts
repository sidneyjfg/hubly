import type { DataSource } from "typeorm";

import { AppointmentsRepository } from "../repositories/appointments.repository";
import { AppointmentNotificationsRepository } from "../repositories/appointment-notifications.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { ClinicIntegrationsRepository } from "../repositories/clinic-integrations.repository";
import { ClinicNotificationSettingsRepository } from "../repositories/clinic-notification-settings.repository";
import { ClinicsRepository } from "../repositories/clinics.repository";
import { PatientsRepository } from "../repositories/patients.repository";
import { EvolutionWhatsAppService } from "./evolution-whatsapp.service";
import { NotificationsService } from "./notifications.service";

export function createNotificationsService(dataSource: DataSource): NotificationsService {
  return new NotificationsService(
    dataSource,
    new ClinicNotificationSettingsRepository(dataSource),
    new AppointmentNotificationsRepository(dataSource),
    new AppointmentsRepository(dataSource),
    new PatientsRepository(dataSource),
    new ClinicsRepository(dataSource),
    new ClinicIntegrationsRepository(dataSource),
    new AuditRepository(dataSource),
    new EvolutionWhatsAppService(),
  );
}
