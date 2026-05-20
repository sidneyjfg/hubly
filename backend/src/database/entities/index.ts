import { BookingEntity } from "./booking.entity";
import { BookingNotificationEntity } from "./booking-notification.entity";
import { BillingPlanEntity } from "./billing-plan.entity";
import { AuditEventEntity } from "./audit-event.entity";
import { AuthSessionEntity } from "./auth-session.entity";
import { OrganizationEntity } from "./organization.entity";
import { OrganizationIntegrationEntity } from "./organization-integration.entity";
import { OrganizationNotificationSettingEntity } from "./organization-notification-setting.entity";
import { OrganizationPaymentSettingsEntity } from "./organization-payment-settings.entity";
import { OrganizationSubscriptionEntity } from "./organization-subscription.entity";
import { CustomerEntity } from "./customer.entity";
import { ProviderAvailabilityEntity } from "./provider-availability.entity";
import { ProviderPaymentSettingsEntity } from "./provider-payment-settings.entity";
import { ProviderEntity } from "./provider.entity";
import { PaymentTransactionEntity } from "./payment-transaction.entity";
import { FinancialLedgerEntity } from "./financial-ledger.entity";
import { ProviderPayoutEntity } from "./provider-payout.entity";
import { StripeWebhookEventEntity } from "./stripe-webhook-event.entity";
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
  ProviderPayoutEntity,
  FinancialLedgerEntity,
  StripeWebhookEventEntity,
  BookingNotificationEntity,
  AuditEventEntity,
  AuthSessionEntity,
  OrganizationIntegrationEntity,
  OrganizationNotificationSettingEntity,
  OrganizationPaymentSettingsEntity,
  OrganizationSubscriptionEntity,
  BillingPlanEntity,
] as const;

export {
  BookingEntity,
  BookingNotificationEntity,
  BillingPlanEntity,
  AuditEventEntity,
  AuthSessionEntity,
  OrganizationEntity,
  OrganizationIntegrationEntity,
  OrganizationNotificationSettingEntity,
  OrganizationPaymentSettingsEntity,
  OrganizationSubscriptionEntity,
  CustomerEntity,
  ProviderAvailabilityEntity,
  ProviderPaymentSettingsEntity,
  ProviderEntity,
  PaymentTransactionEntity,
  ProviderPayoutEntity,
  FinancialLedgerEntity,
  StripeWebhookEventEntity,
  ServiceOfferingEntity,
  UserEntity,
};
