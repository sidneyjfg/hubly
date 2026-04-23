import type { DataSource } from "typeorm";

import {
  AppointmentEntity,
  AuditEventEntity,
  AuthSessionEntity,
  ClinicEntity,
  ClinicIntegrationEntity,
  PatientEntity,
  ProfessionalEntity,
  UserEntity,
} from "../entities";
import { seedData } from "./seed-data";

export const seedDatabase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.transaction(async (manager) => {
    await manager.createQueryBuilder().delete().from(AuthSessionEntity).execute();
    await manager.createQueryBuilder().delete().from(AppointmentEntity).execute();
    await manager.createQueryBuilder().delete().from(AuditEventEntity).execute();
    await manager.createQueryBuilder().delete().from(ClinicIntegrationEntity).execute();
    await manager.createQueryBuilder().delete().from(ProfessionalEntity).execute();
    await manager.createQueryBuilder().delete().from(PatientEntity).execute();
    await manager.createQueryBuilder().delete().from(UserEntity).execute();
    await manager.createQueryBuilder().delete().from(ClinicEntity).execute();

    await manager.save(ClinicEntity, [...seedData.clinics]);
    await manager.save(UserEntity, [...seedData.users]);
    await manager.save(ProfessionalEntity, [...seedData.professionals]);
    await manager.save(PatientEntity, [...seedData.patients]);
    await manager.save(AppointmentEntity, [...seedData.appointments]);
    await manager.save(AuditEventEntity, [...seedData.auditEvents]);
  });
};
