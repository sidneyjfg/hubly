import type { DataSource } from "typeorm";

import { BookingsRepository } from "../repositories/bookings.repository";
import { BookingNotificationsRepository } from "../repositories/booking-notifications.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { EvolutionWhatsAppService } from "./evolution-whatsapp.service";
import { NotificationsService } from "./notifications.service";

export function createNotificationsService(dataSource: DataSource): NotificationsService {
  return new NotificationsService(
    dataSource,
    new OrganizationNotificationSettingsRepository(dataSource),
    new BookingNotificationsRepository(dataSource),
    new BookingsRepository(dataSource),
    new CustomersRepository(dataSource),
    new OrganizationsRepository(dataSource),
    new OrganizationIntegrationsRepository(dataSource),
    new AuditRepository(dataSource),
    new EvolutionWhatsAppService(),
  );
}
