import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn } from "typeorm";

import { AppointmentEntity } from "./appointment.entity";
import { AppointmentNotificationEntity } from "./appointment-notification.entity";
import { AuditEventEntity } from "./audit-event.entity";
import { ClinicIntegrationEntity } from "./clinic-integration.entity";
import { ClinicNotificationSettingEntity } from "./clinic-notification-setting.entity";
import { PatientEntity } from "./patient.entity";
import { ProfessionalEntity } from "./professional.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "clinics" })
export class ClinicEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 160 })
  public legalName!: string;

  @Column({ type: "varchar", length: 160 })
  public tradeName!: string;

  @Column({ type: "varchar", length: 60 })
  public timezone!: string;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => UserEntity, (user) => user.clinic)
  public users!: UserEntity[];

  @OneToMany(() => ProfessionalEntity, (professional) => professional.clinic)
  public professionals!: ProfessionalEntity[];

  @OneToMany(() => PatientEntity, (patient) => patient.clinic)
  public patients!: PatientEntity[];

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.clinic)
  public appointments!: AppointmentEntity[];

  @OneToMany(() => AuditEventEntity, (auditEvent) => auditEvent.clinic)
  public auditEvents!: AuditEventEntity[];

  @OneToMany(() => ClinicIntegrationEntity, (integration) => integration.clinic)
  public integrations!: ClinicIntegrationEntity[];

  @OneToMany(() => ClinicNotificationSettingEntity, (setting) => setting.clinic)
  public notificationSettings!: ClinicNotificationSettingEntity[];

  @OneToMany(() => AppointmentNotificationEntity, (notification) => notification.clinic)
  public appointmentNotifications!: AppointmentNotificationEntity[];
}
