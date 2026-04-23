import { AppointmentEntity } from "./appointment.entity";
import { AppointmentNotificationEntity } from "./appointment-notification.entity";
import { AuditEventEntity } from "./audit-event.entity";
import { AuthSessionEntity } from "./auth-session.entity";
import { ClinicEntity } from "./clinic.entity";
import { ClinicIntegrationEntity } from "./clinic-integration.entity";
import { ClinicNotificationSettingEntity } from "./clinic-notification-setting.entity";
import { PatientEntity } from "./patient.entity";
import { ProfessionalEntity } from "./professional.entity";
import { ProfessionalServiceEntity } from "./professional-service.entity";
import { UserEntity } from "./user.entity";

export const databaseEntities = [
  ClinicEntity,
  UserEntity,
  ProfessionalEntity,
  ProfessionalServiceEntity,
  PatientEntity,
  AppointmentEntity,
  AppointmentNotificationEntity,
  AuditEventEntity,
  AuthSessionEntity,
  ClinicIntegrationEntity,
  ClinicNotificationSettingEntity,
] as const;

export {
  AppointmentEntity,
  AppointmentNotificationEntity,
  AuditEventEntity,
  AuthSessionEntity,
  ClinicEntity,
  ClinicIntegrationEntity,
  ClinicNotificationSettingEntity,
  PatientEntity,
  ProfessionalEntity,
  ProfessionalServiceEntity,
  UserEntity,
};
