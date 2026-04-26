import { BookingEntity } from "./booking.entity";
import { BookingNotificationEntity } from "./booking-notification.entity";
import { AuditEventEntity } from "./audit-event.entity";
import { AuthSessionEntity } from "./auth-session.entity";
import { OrganizationEntity } from "./organization.entity";
import { OrganizationIntegrationEntity } from "./organization-integration.entity";
import { OrganizationNotificationSettingEntity } from "./organization-notification-setting.entity";
import { CustomerEntity } from "./customer.entity";
import { ProviderAvailabilityEntity } from "./provider-availability.entity";
import { ProviderEntity } from "./provider.entity";
import { ServiceOfferingEntity } from "./service-offering.entity";
import { UserEntity } from "./user.entity";

export const databaseEntities = [
  OrganizationEntity,
  UserEntity,
  ProviderEntity,
  ProviderAvailabilityEntity,
  ServiceOfferingEntity,
  CustomerEntity,
  BookingEntity,
  BookingNotificationEntity,
  AuditEventEntity,
  AuthSessionEntity,
  OrganizationIntegrationEntity,
  OrganizationNotificationSettingEntity,
] as const;

export {
  BookingEntity,
  BookingNotificationEntity,
  AuditEventEntity,
  AuthSessionEntity,
  OrganizationEntity,
  OrganizationIntegrationEntity,
  OrganizationNotificationSettingEntity,
  CustomerEntity,
  ProviderAvailabilityEntity,
  ProviderEntity,
  ServiceOfferingEntity,
  UserEntity,
};
