import type { DataSource } from "typeorm";

import {
  BookingEntity,
  AuditEventEntity,
  AuthSessionEntity,
  OrganizationEntity,
  OrganizationIntegrationEntity,
  CustomerEntity,
  ProviderAvailabilityEntity,
  ProviderEntity,
  UserEntity,
} from "../entities";
import { seedData } from "./seed-data";

export const seedDatabase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.transaction(async (manager) => {
    await manager.createQueryBuilder().delete().from(AuthSessionEntity).execute();
    await manager.createQueryBuilder().delete().from(BookingEntity).execute();
    await manager.createQueryBuilder().delete().from(AuditEventEntity).execute();
    await manager.createQueryBuilder().delete().from(OrganizationIntegrationEntity).execute();
    await manager.createQueryBuilder().delete().from(ProviderAvailabilityEntity).execute();
    await manager.createQueryBuilder().delete().from(ProviderEntity).execute();
    await manager.createQueryBuilder().delete().from(CustomerEntity).execute();
    await manager.createQueryBuilder().delete().from(UserEntity).execute();
    await manager.createQueryBuilder().delete().from(OrganizationEntity).execute();

    await manager.save(OrganizationEntity, [...seedData.organizations]);
    await manager.save(UserEntity, [...seedData.users]);
    await manager.save(ProviderEntity, [...seedData.providers]);
    await manager.save(ProviderAvailabilityEntity, [...seedData.providerAvailabilities]);
    await manager.save(CustomerEntity, [...seedData.customers]);
    await manager.save(BookingEntity, [...seedData.bookings]);
    await manager.save(AuditEventEntity, [...seedData.auditEvents]);
  });
};
