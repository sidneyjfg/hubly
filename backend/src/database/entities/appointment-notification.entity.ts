import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { AppointmentEntity } from "./appointment.entity";
import { ClinicEntity } from "./clinic.entity";

@Entity({ name: "appointment_notifications" })
@Index("idx_appointment_notifications_clinic_status_scheduled_for", ["clinicId", "status", "scheduledFor"])
@Index("idx_appointment_notifications_appointment_channel", ["appointmentId", "channel"])
export class AppointmentNotificationEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public clinicId!: string;

  @ManyToOne(() => ClinicEntity, (clinic) => clinic.appointmentNotifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clinicId" })
  public clinic!: ClinicEntity;

  @Column({ type: "varchar", length: 36 })
  public appointmentId!: string;

  @ManyToOne(() => AppointmentEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "appointmentId" })
  public appointment!: AppointmentEntity;

  @Column({ type: "varchar", length: 32 })
  public channel!: string;

  @Column({ type: "varchar", length: 32 })
  public status!: string;

  @Column({ type: "datetime" })
  public scheduledFor!: Date;

  @Column({ type: "int" })
  public hoursBefore!: number;

  @Column({ type: "varchar", length: 30 })
  public patientPhone!: string;

  @Column({ type: "varchar", length: 1000 })
  public message!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  public externalMessageId!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  public lastError!: string | null;

  @Column({ type: "datetime", nullable: true })
  public sentAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  public cancelledAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  public failedAt!: Date | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
