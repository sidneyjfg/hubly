import { BookingEntity } from "./booking.entity";
import { BookingNotificationEntity } from "./booking-notification.entity";
import { AuditEventEntity } from "./audit-event.entity";
import { AuthSessionEntity } from "./auth-session.entity";
import { OrganizationEntity } from "./organization.entity";
import { OrganizationIntegrationEntity } from "./organization-integration.entity";
import { OrganizationNotificationSettingEntity } from "./organization-notification-setting.entity";
import { OrganizationPaymentSettingsEntity } from "./organization-payment-settings.entity";
import { CustomerEntity } from "./customer.entity";
import { ProviderAvailabilityEntity } from "./provider-availability.entity";
import { ProviderPaymentSettingsEntity } from "./provider-payment-settings.entity";
import { ProviderEntity } from "./provider.entity";
import { PaymentTransactionEntity } from "./payment-transaction.entity";
import { ServiceOfferingEntity } from "./service-offering.entity";
import { UserEntity } from "./user.entity";

export const databaseEntities = [
  OrganizationEntity,
  UserEntity,
  ProviderEntity,
  ProviderAvailabilityEntity,
  ProviderPaymentSettingsEntity,
  ServiceOfferingEntity,
  CustomerEntity,
  BookingEntity,
  PaymentTransactionEntity,
  BookingNotificationEntity,
  AuditEventEntity,
  AuthSessionEntity,
  OrganizationIntegrationEntity,
  OrganizationNotificationSettingEntity,
  OrganizationPaymentSettingsEntity,
] as const;

export {
  BookingEntity,
  BookingNotificationEntity,
  AuditEventEntity,
  AuthSessionEntity,
  OrganizationEntity,
  OrganizationIntegrationEntity,
  OrganizationNotificationSettingEntity,
  OrganizationPaymentSettingsEntity,
  CustomerEntity,
  ProviderAvailabilityEntity,
  ProviderPaymentSettingsEntity,
  ProviderEntity,
  PaymentTransactionEntity,
  ServiceOfferingEntity,
  UserEntity,
};
