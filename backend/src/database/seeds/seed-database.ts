import type { DataSource } from "typeorm";

import {
  BookingEntity,
  AuditEventEntity,
  AuthSessionEntity,
  BillingPlanEntity,
  OrganizationEntity,
  OrganizationIntegrationEntity,
  OrganizationSubscriptionEntity,
  CustomerEntity,
  ProviderAvailabilityEntity,
  ProviderEntity,
  ServiceOfferingEntity,
  UserEntity,
} from "../entities";
import { seedData } from "./seed-data";

export const seedDatabase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.transaction(async (manager) => {
    await manager.createQueryBuilder().delete().from(AuthSessionEntity).execute();
    await manager.createQueryBuilder().delete().from(OrganizationSubscriptionEntity).execute();
    await manager.createQueryBuilder().delete().from(BookingEntity).execute();
    await manager.createQueryBuilder().delete().from(AuditEventEntity).execute();
    await manager.createQueryBuilder().delete().from(OrganizationIntegrationEntity).execute();
    await manager.createQueryBuilder().delete().from(ProviderAvailabilityEntity).execute();
    await manager.createQueryBuilder().delete().from(ServiceOfferingEntity).execute();
    await manager.createQueryBuilder().delete().from(ProviderEntity).execute();
    await manager.createQueryBuilder().delete().from(CustomerEntity).execute();
    await manager.createQueryBuilder().delete().from(UserEntity).execute();
    await manager.createQueryBuilder().delete().from(OrganizationEntity).execute();
    await manager.createQueryBuilder().delete().from(BillingPlanEntity).execute();

    await manager.save(BillingPlanEntity, [...seedData.billingPlans]);
    await manager.save(
      OrganizationEntity,
      seedData.organizations.map((organization) => ({
        ...organization,
        galleryImageUrls: [...organization.galleryImageUrls],
      })),
    );
    await manager.save(ProviderEntity, [...seedData.providers]);
    await manager.save(UserEntity, [...seedData.users]);
    await manager.save(ProviderAvailabilityEntity, [...seedData.providerAvailabilities]);
    await manager.save(ServiceOfferingEntity, [...seedData.serviceOfferings]);
    await manager.save(CustomerEntity, [...seedData.customers]);
    await manager.save(BookingEntity, [...seedData.bookings]);
    await manager.save(OrganizationSubscriptionEntity, [...seedData.organizationSubscriptions]);
    await manager.save(AuditEventEntity, [...seedData.auditEvents]);
  });
};
